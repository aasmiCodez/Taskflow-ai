const express = require("express");
const rateLimit = require("express-rate-limit");
const { Role, TaskStatus } = require("@prisma/client");
const { prisma } = require("./db");
const { redisClient } = require("./redis");
const { authenticate, authorize } = require("./middleware");
const {
  registerSchema,
  createUserSchema,
  loginSchema,
  setupPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userUpdateSchema,
  taskSchema,
  taskUpdateSchema,
  subtaskSchema,
  subtaskUpdateSchema,
  aiSearchSchema,
  aiDescriptionSchema,
} = require("./validation");
const {
  createToken,
  createOpaqueToken,
  hashOpaqueToken,
  durationToMs,
  buildCredentialLink,
  hashPassword,
  comparePassword,
  sanitizeUser,
  scoreTaskAgainstQuery,
  verifyPasswordSetupToken,
} = require("./utils");
const { enhanceTaskDescription, generateSubtasks } = require("./ai");
const { formatTask } = require("./formatters");
const { sendUserOnboardingEmail, sendPasswordResetEmail } = require("./email");
const { config } = require("./config");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const taskInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
  assignee: {
    select: { id: true, name: true, email: true, role: true, managerId: true },
  },
  subtasks: {
    orderBy: { createdAt: "asc" },
  },
};

const statusFlow = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.COMPLETED];

function isPrivileged(role) {
  return role === Role.ADMIN || role === Role.PMO || role === Role.MANAGER;
}

function canManageUsers(role) {
  return role === Role.ADMIN;
}

function canCreateTasks(role) {
  return role === Role.ADMIN || role === Role.PMO || role === Role.MANAGER;
}

function isManagerOf(user, member) {
  return Boolean(member && member.managerId && member.managerId === user.id);
}

function canAccessTask(user, task) {
  if (user.role === Role.ADMIN || user.role === Role.PMO) return true;
  if (user.role === Role.MANAGER) {
    return task.createdById === user.id || task.assigneeId === user.id || task.assignee?.managerId === user.id;
  }
  return task.assigneeId === user.id;
}

function canDeleteTask(user, task) {
  return user.role === Role.ADMIN || user.role === Role.PMO || (user.role === Role.MANAGER && task.createdById === user.id);
}

function canManageSubtask(user, subtaskTask) {
  return canAccessTask(user, subtaskTask);
}

function getTaskScope(user) {
  if (user.role === Role.ADMIN || user.role === Role.PMO) {
    return {};
  }

  if (user.role === Role.MANAGER) {
    return {
      OR: [
        { createdById: user.id },
        { assigneeId: user.id },
        { assignee: { managerId: user.id } },
      ],
    };
  }

  return { assigneeId: user.id };
}

function getStatusIndex(status) {
  return statusFlow.indexOf(status);
}

function isSequentialStatusTransition(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) {
    return true;
  }

  const currentIndex = getStatusIndex(currentStatus);
  const nextIndex = getStatusIndex(nextStatus);
  return currentIndex > -1 && nextIndex > -1 && Math.abs(nextIndex - currentIndex) === 1;
}

function buildStatusUpdateFields(currentStatus, nextStatus, existingDates = {}) {
  if (!nextStatus || currentStatus === nextStatus) {
    return {};
  }

  const now = new Date();

  return {
    status: nextStatus,
    startedAt: nextStatus === TaskStatus.IN_PROGRESS ? existingDates.startedAt || now : existingDates.startedAt || null,
    reviewAt: nextStatus === TaskStatus.REVIEW ? existingDates.reviewAt || now : existingDates.reviewAt || null,
    completedAt: nextStatus === TaskStatus.COMPLETED ? now : null,
  };
}

function getBulkDeleteTaskScope(user) {
  if (user.role === Role.ADMIN || user.role === Role.PMO) {
    return {};
  }

  if (user.role === Role.MANAGER) {
    return { createdById: user.id };
  }

  return null;
}

async function assertUserAssignmentAllowed(actor, assigneeId) {
  if (!assigneeId) return;

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { id: true, role: true, managerId: true, name: true },
  });

  if (!assignee) {
    const error = new Error("Assignee not found.");
    error.statusCode = 404;
    throw error;
  }

  if (actor.role === Role.ADMIN || actor.role === Role.PMO) {
    if (![Role.MANAGER, Role.MEMBER].includes(assignee.role)) {
      const error = new Error("Tasks can only be assigned to managers or members.");
      error.statusCode = 400;
      throw error;
    }
    return;
  }

  if (actor.role === Role.MANAGER) {
    const sameManager = assignee.id === actor.id || (assignee.role === Role.MEMBER && assignee.managerId === actor.id);
    if (!sameManager) {
      const error = new Error("Managers can assign tasks only to themselves or members in their own team.");
      error.statusCode = 403;
      throw error;
    }
    return;
  }

  const error = new Error("You cannot assign tasks.");
  error.statusCode = 403;
  throw error;
}

async function assertManagerReference(managerId) {
  if (!managerId) return;

  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, role: true },
  });

  if (!manager || manager.role !== Role.MANAGER) {
    const error = new Error("Manager assignment must point to a valid manager.");
    error.statusCode = 400;
    throw error;
  }
}

function ensureManagerAssignmentRules(data) {
  if (data.role === Role.MEMBER && !data.managerId) {
    const error = new Error("Members must be assigned to a manager.");
    error.statusCode = 400;
    throw error;
  }

  if (data.role !== Role.MEMBER && data.managerId) {
    const error = new Error("Only members can belong to a manager team.");
    error.statusCode = 400;
    throw error;
  }
}

async function syncTaskStoryPoints(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      storyPoints: true,
      subtasks: {
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
    },
  });

  if (!task || !task.subtasks.length) {
    return;
  }

  const totalPoints = Math.max(0, task.storyPoints);
  const subtaskCount = task.subtasks.length;
  const basePoints = subtaskCount > 0 ? Math.floor(totalPoints / subtaskCount) : 0;
  const remainder = subtaskCount > 0 ? totalPoints % subtaskCount : 0;

  const updates = task.subtasks.map((subtask, index) =>
    prisma.subtask.update({
      where: { id: subtask.id },
      data: {
        storyPoints: index < remainder ? basePoints + 1 : basePoints,
      },
    })
  );

  if (updates.length) {
    await prisma.$transaction(updates);
  }
}

async function invalidateDashboardCache() {
  try {
    const keys = await redisClient.keys("dashboard:*");
    if (keys.length) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.warn("Redis cache invalidation failed", err);
  }
}

async function issuePasswordSetupToken(userId) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + durationToMs(config.passwordSetupExpiresIn));

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordSetupTokenHash: tokenHash,
      passwordSetupExpiresAt: expiresAt,
    },
  });

  return token;
}

async function issuePasswordResetToken(userId) {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + durationToMs(config.passwordResetExpiresIn));

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  return token;
}

async function consumeStoredToken(token, purpose) {
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();

  if (purpose === "setup") {
    return prisma.user.findFirst({
      where: {
        passwordSetupTokenHash: tokenHash,
        passwordSetupExpiresAt: { gt: now },
      },
    });
  }

  return prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: now },
    },
  });
}

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "taskflow-ai" });
});

router.post("/api/auth/register", authLimiter, async (req, res) => {
  const data = registerSchema.parse(req.body);
  const existingUsersCount = await prisma.user.count();
  const requestedRole = data.role || Role.MEMBER;

  if (existingUsersCount > 0 && requestedRole === Role.ADMIN) {
    return res.status(403).json({
      message: "Admin registration is disabled after initial bootstrap.",
    });
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: existingUsersCount === 0 ? Role.ADMIN : requestedRole,
    },
  });

  const safeUser = sanitizeUser(user);
  const token = createToken(safeUser);
  res.status(201).json({ token, user: safeUser });
});

router.post("/api/auth/login", authLimiter, async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isValid = await comparePassword(data.password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const safeUser = sanitizeUser(user);
  if (user.passwordSetupRequired) {
    const setupToken = await issuePasswordSetupToken(user.id);
    return res.json({
      requiresPasswordSetup: true,
      setupToken,
      user: safeUser,
    });
  }

  const token = createToken(safeUser);
  res.json({ token, user: safeUser });
});

router.post("/api/auth/setup-password", authLimiter, async (req, res) => {
  const data = setupPasswordSchema.parse(req.body);
  const existing = await consumeStoredToken(data.setupToken, "setup");
  if (!existing) {
    return res.status(400).json({ message: "This password setup link is invalid or has expired." });
  }

  const updatedUser = await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash: await hashPassword(data.password),
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  const safeUser = sanitizeUser(updatedUser);
  const token = createToken(safeUser);
  res.json({ token, user: safeUser });
});

router.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  const data = forgotPasswordSchema.parse(req.body);
  const genericMessage = "If an account exists for that email, password reset instructions have been sent.";
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    return res.json({ message: genericMessage });
  }

  const resetToken = await issuePasswordResetToken(user.id);
  const resetLink = buildCredentialLink("reset", resetToken);
  await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetLink,
  });

  return res.json({ message: genericMessage });
});

router.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  const data = resetPasswordSchema.parse(req.body);
  const existing = await consumeStoredToken(data.token, "reset");

  if (!existing) {
    return res.status(400).json({ message: "This password reset link is invalid or has expired." });
  }

  const updatedUser = await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash: await hashPassword(data.password),
      passwordSetupRequired: false,
      passwordSetupTokenHash: null,
      passwordSetupExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  const safeUser = sanitizeUser(updatedUser);
  const token = createToken(safeUser);
  res.json({ token, user: safeUser });
});

router.get("/api/auth/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.patch("/api/auth/me", authenticate, async (req, res) => {
  const data = userUpdateSchema
    .pick({
      name: true,
      password: true,
    })
    .parse(req.body);

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.password !== undefined ? { passwordHash: await hashPassword(data.password) } : {}),
      ...(data.password !== undefined ? { passwordSetupRequired: false } : {}),
    },
  });

  await invalidateDashboardCache();
  res.json({ user: sanitizeUser(updatedUser) });
});

router.get("/api/users", authenticate, authorize(Role.ADMIN, Role.PMO, Role.MANAGER), async (req, res) => {
  const where =
    req.user.role === Role.MANAGER
      ? {
          OR: [{ id: req.user.id }, { managerId: req.user.id }],
        }
      : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      passwordSetupRequired: true,
      createdAt: true,
      updatedAt: true,
      manager: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: { assignedTasks: true, createdTasks: true },
      },
    },
  });

  res.json({ users });
});

router.post("/api/users", authenticate, authorize(Role.ADMIN), async (req, res) => {
  const data = createUserSchema.parse(req.body);
  ensureManagerAssignmentRules(data);
  await assertManagerReference(data.managerId);

  const generatedPassword = createOpaqueToken();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(generatedPassword),
      role: data.role || Role.MEMBER,
      managerId: data.managerId || null,
      passwordSetupRequired: true,
    },
  });

  const setupToken = await issuePasswordSetupToken(user.id);
  const setupLink = buildCredentialLink("setup", setupToken);

  const emailStatus = await sendUserOnboardingEmail({
    email: user.email,
    name: user.name,
    setupLink,
  });

  await invalidateDashboardCache();
  res.status(201).json({ user: sanitizeUser(user), emailDelivery: emailStatus.delivery });
});

router.patch("/api/users/:userId", authenticate, authorize(Role.ADMIN), async (req, res) => {
  const data = userUpdateSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { id: req.params.userId } });

  if (!existing) {
    return res.status(404).json({ message: "User not found." });
  }

  if (req.user.id === existing.id && data.role && data.role !== Role.ADMIN) {
    return res.status(400).json({ message: "Admins cannot remove their own admin access." });
  }

  ensureManagerAssignmentRules({
    role: data.role || existing.role,
    managerId: data.managerId !== undefined ? data.managerId : existing.managerId,
  });
  await assertManagerReference(data.managerId !== undefined ? data.managerId : existing.managerId);

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.managerId !== undefined ? { managerId: data.managerId || null } : {}),
      ...(data.password !== undefined ? { passwordHash: await hashPassword(data.password) } : {}),
      ...(data.password !== undefined ? { passwordSetupRequired: false } : {}),
    },
  });

  await invalidateDashboardCache();
  res.json({ user: sanitizeUser(user) });
});

router.delete("/api/users/:userId", authenticate, authorize(Role.ADMIN), async (req, res) => {
  if (req.user.id === req.params.userId) {
    return res.status(400).json({ message: "Admins cannot delete their own account." });
  }

  const existing = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!existing) {
    return res.status(404).json({ message: "User not found." });
  }

  await prisma.user.delete({ where: { id: existing.id } });
  await invalidateDashboardCache();
  res.status(204).send();
});

router.get("/api/dashboard", authenticate, async (req, res) => {
  const cacheKey = `dashboard:${req.user.id}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (error) {
    console.warn("Redis dashboard cache read failed", error);
  }

  const scope = getTaskScope(req.user);
  const [tasks, usersCount] = await Promise.all([
    prisma.task.findMany({
      where: scope,
      include: taskInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.count(),
  ]);

  const stats = {
    totalTasks: tasks.length,
    todoTasks: tasks.filter((task) => task.status === TaskStatus.TODO).length,
    inProgressTasks: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
    reviewTasks: tasks.filter((task) => task.status === TaskStatus.REVIEW).length,
    completedTasks: tasks.filter((task) => task.status === TaskStatus.COMPLETED).length,
    overdueTasks: tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED
    ).length,
    teamMembers: usersCount,
  };

  const payload = {
    stats,
    tasks: tasks.map(formatTask),
  };

  try {
    await redisClient.setEx(cacheKey, 30, JSON.stringify(payload));
  } catch (error) {
    console.warn("Redis dashboard cache write failed", error);
  }

  res.json(payload);
});

router.get("/api/tasks", authenticate, async (req, res) => {
  const scope = getTaskScope(req.user);
  const tasks = await prisma.task.findMany({
    where: scope,
    include: taskInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  res.json({ tasks: tasks.map(formatTask) });
});

router.get("/api/tasks/:taskId", authenticate, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: taskInclude,
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (!canAccessTask(req.user, task)) {
    return res.status(403).json({ message: "You do not have access to this task." });
  }

  res.json({ task: formatTask(task) });
});

router.post("/api/tasks", authenticate, authorize(Role.ADMIN, Role.PMO, Role.MANAGER), async (req, res) => {
  const data = taskSchema.parse(req.body);
  await assertUserAssignmentAllowed(req.user, data.assigneeId);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      storyPoints: data.storyPoints,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
      createdById: req.user.id,
    },
    include: taskInclude,
  });

  if (data.autoGenerateSubtasks) {
    const result = await generateSubtasks(task);
    const limitedSuggestions = result.suggestions.slice(0, 6);
    if (limitedSuggestions.length) {
      await prisma.$transaction(
        limitedSuggestions.map((suggestion) =>
          prisma.subtask.create({
            data: {
              taskId: task.id,
              title: suggestion.title,
              storyPoints: 0,
              dueDate: suggestion.dueDate ? new Date(suggestion.dueDate) : null,
              source: result.source,
            },
          })
        )
      );
      await syncTaskStoryPoints(task.id);
    }
  }

  await invalidateDashboardCache();
  const refreshedTask = await prisma.task.findUnique({
    where: { id: task.id },
    include: taskInclude,
  });

  res.status(201).json({ task: formatTask(refreshedTask) });
});

router.delete("/api/tasks", authenticate, authorize(Role.ADMIN, Role.PMO, Role.MANAGER), async (req, res) => {
  const scope = getBulkDeleteTaskScope(req.user);

  if (!scope) {
    return res.status(403).json({ message: "You do not have permission to delete tasks in bulk." });
  }

  const result = await prisma.task.deleteMany({ where: scope });
  await invalidateDashboardCache();
  res.json({ deletedCount: result.count });
});

router.patch("/api/tasks/:taskId", authenticate, async (req, res) => {
  const data = taskUpdateSchema.parse(req.body);
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: taskInclude,
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  const privileged = req.user.role === Role.ADMIN || req.user.role === Role.PMO || req.user.role === Role.MANAGER;
  const isAssignee = task.assigneeId === req.user.id;

  if (!privileged && !isAssignee) {
    return res.status(403).json({ message: "You cannot update this task." });
  }

  if (!privileged && Object.keys(data).some((key) => key !== "status")) {
    return res.status(403).json({ message: "Members can only move their assigned tasks." });
  }

  if (privileged && data.assigneeId !== undefined) {
    await assertUserAssignmentAllowed(req.user, data.assigneeId);
  }

  if (data.status !== undefined && !isSequentialStatusTransition(task.status, data.status)) {
    return res.status(400).json({
      message: `Tasks must move one step at a time: ${task.status.replace("_", " ")} cannot move directly to ${data.status.replace("_", " ")}.`,
    });
  }

  const updatedTask = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.storyPoints !== undefined ? { storyPoints: data.storyPoints } : {}),
      ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId || null } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(data.status !== undefined
        ? buildStatusUpdateFields(task.status, data.status, {
            startedAt: task.startedAt,
            reviewAt: task.reviewAt,
            completedAt: task.completedAt,
          })
        : {}),
    },
    include: taskInclude,
  });

  if (data.storyPoints !== undefined) {
    await syncTaskStoryPoints(updatedTask.id);
  }
  await invalidateDashboardCache();
  const refreshedTask = await prisma.task.findUnique({
    where: { id: updatedTask.id },
    include: taskInclude,
  });
  res.json({ task: formatTask(refreshedTask) });
});

router.delete("/api/tasks/:taskId", authenticate, authorize(Role.ADMIN, Role.PMO, Role.MANAGER), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (!canDeleteTask(req.user, task)) {
    return res.status(403).json({ message: "Managers can delete only the tasks they created." });
  }

  await prisma.task.delete({ where: { id: task.id } });
  await invalidateDashboardCache();
  res.status(204).send();
});

router.post("/api/tasks/:taskId/subtasks", authenticate, async (req, res) => {
  const data = subtaskSchema.parse(req.body);
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  if (!canManageSubtask(req.user, task)) {
    return res.status(403).json({ message: "You cannot add a subtask here." });
  }

  const subtask = await prisma.subtask.create({
    data: {
      title: data.title,
      storyPoints: 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: TaskStatus.TODO,
      taskId: task.id,
    },
  });

  await syncTaskStoryPoints(task.id);
  await invalidateDashboardCache();
  res.status(201).json({ subtask });
});

router.patch("/api/subtasks/:subtaskId", authenticate, async (req, res) => {
  const data = subtaskUpdateSchema.parse(req.body);
  const subtask = await prisma.subtask.findUnique({
    where: { id: req.params.subtaskId },
    include: {
      task: {
        include: {
          assignee: {
            select: { managerId: true },
          },
        },
      },
    },
  });

  if (!subtask) {
    return res.status(404).json({ message: "Subtask not found." });
  }

  const privileged = isPrivileged(req.user.role);
  if (!canManageSubtask(req.user, subtask.task)) {
    return res.status(403).json({ message: "You cannot update this subtask." });
  }

  if (!privileged && Object.keys(data).some((key) => !["completed", "status"].includes(key))) {
    return res.status(403).json({ message: "Members can only move or complete assigned subtasks." });
  }

  if (data.status !== undefined && !isSequentialStatusTransition(subtask.status, data.status)) {
    return res.status(400).json({
      message: `Subtasks must move one step at a time: ${subtask.status.replace("_", " ")} cannot move directly to ${data.status.replace("_", " ")}.`,
    });
  }

  const updatedSubtask = await prisma.subtask.update({
    where: { id: req.params.subtaskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.storyPoints !== undefined ? { storyPoints: data.storyPoints } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(data.status !== undefined
        ? {
            ...buildStatusUpdateFields(subtask.status, data.status, {
              startedAt: subtask.startedAt,
              reviewAt: subtask.reviewAt,
              completedAt: subtask.completedAt,
            }),
            completed: data.status === TaskStatus.COMPLETED,
          }
        : {}),
      ...(data.completed !== undefined
        ? {
          completed: data.completed,
          status: data.completed ? TaskStatus.COMPLETED : TaskStatus.TODO,
          startedAt: data.completed ? subtask.startedAt : null,
          reviewAt: data.completed ? subtask.reviewAt : null,
          completedAt: data.completed ? new Date() : null,
        }
        : {}),
    },
  });

  if (data.storyPoints !== undefined) {
    await syncTaskStoryPoints(subtask.taskId);
  }
  await invalidateDashboardCache();
  res.json({ subtask: updatedSubtask });
});

router.delete("/api/subtasks/:subtaskId", authenticate, async (req, res) => {
  const subtask = await prisma.subtask.findUnique({
    where: { id: req.params.subtaskId },
    include: {
      task: {
        include: {
          assignee: {
            select: { managerId: true },
          },
        },
      },
    },
  });

  if (!subtask) {
    return res.status(404).json({ message: "Subtask not found." });
  }

  if (!canManageSubtask(req.user, subtask.task)) {
    return res.status(403).json({ message: "You cannot delete this subtask." });
  }

  await prisma.subtask.delete({ where: { id: subtask.id } });
  await syncTaskStoryPoints(subtask.taskId);
  await invalidateDashboardCache();
  res.status(204).send();
});

router.post("/api/ai/description", authenticate, authorize(Role.ADMIN, Role.PMO, Role.MANAGER), async (req, res) => {
  const data = aiDescriptionSchema.parse(req.body);
  const result = await enhanceTaskDescription(data);
  res.json(result);
});

router.post("/api/ai/tasks/:taskId/subtasks", authenticate, authorize(Role.ADMIN, Role.PMO, Role.MANAGER), async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: taskInclude,
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  const result = await generateSubtasks(task);
  const created = await prisma.$transaction(
    result.suggestions.slice(0, 6).map((title) =>
      prisma.subtask.create({
        data: {
          taskId: task.id,
          title: title.title,
          storyPoints: 0,
          dueDate: title.dueDate ? new Date(title.dueDate) : null,
          source: result.source,
        },
      })
    )
  );

  await syncTaskStoryPoints(task.id);
  await invalidateDashboardCache();

  res.json({
    source: result.source,
    warning: result.warning,
    subtasks: created,
  });
});

router.post("/api/ai/search", authenticate, async (req, res) => {
  const data = aiSearchSchema.parse(req.body);
  const scope = getTaskScope(req.user);
  const tasks = await prisma.task.findMany({
    where: scope,
    include: taskInclude,
  });

  const ranked = tasks
    .map((task) => ({
      task,
      score: scoreTaskAgainstQuery(task, data.query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const summary =
    ranked.length > 0
      ? `Found ${ranked.length} relevant task${ranked.length > 1 ? "s" : ""} for "${data.query}". Prioritize the top-ranked matches first.`
      : `No strong matches found for "${data.query}". Try searching by assignee, priority, or milestone keyword.`;

  res.json({
    summary,
    results: ranked.map(({ task, score }) => ({
      score,
      task: formatTask(task),
    })),
  });
});

module.exports = { router };
