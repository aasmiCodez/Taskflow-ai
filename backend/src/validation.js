const { z } = require("zod");

const email = z.string().email().trim().toLowerCase();
const password = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/\d/, "Password must contain at least one number.");

const registerSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email,
  password,
  role: z.enum(["ADMIN", "PMO", "MANAGER", "MEMBER"]).optional(),
  managerId: z.string().cuid().optional().nullable(),
});

const userUpdateSchema = z
  .object({
    name: z.string().min(2).max(80).trim().optional(),
    password: password.optional(),
    role: z.enum(["ADMIN", "PMO", "MANAGER", "MEMBER"]).optional(),
    managerId: z.string().cuid().optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one user field to update.",
  });

const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

const setupPasswordSchema = z.object({
  setupToken: z.string().min(1),
  password,
});

const taskSchema = z.object({
  title: z.string().min(3).max(120).trim(),
  description: z.string().min(5).max(1000).trim(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  storyPoints: z.number().int().min(1).max(21).default(3),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  autoGenerateSubtasks: z.boolean().optional().default(true),
});

const taskUpdateSchema = z.object({
  title: z.string().min(3).max(120).trim().optional(),
  description: z.string().min(5).max(1000).trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]).optional(),
  storyPoints: z.number().int().min(1).max(21).optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const subtaskSchema = z.object({
  title: z.string().min(2).max(180).trim(),
  storyPoints: z.number().int().min(1).max(13).optional().default(1),
  dueDate: z.string().datetime().optional().nullable(),
});

const subtaskUpdateSchema = z
  .object({
    title: z.string().min(2).max(180).trim().optional(),
    storyPoints: z.number().int().min(1).max(13).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]).optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one subtask field to update.",
  });

const aiSearchSchema = z.object({
  query: z.string().min(2).max(200).trim(),
});

const aiDescriptionSchema = z.object({
  title: z.string().min(3).max(120).trim(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  context: z.string().max(1000).trim().optional(),
});

module.exports = {
  registerSchema,
  userUpdateSchema,
  loginSchema,
  setupPasswordSchema,
  taskSchema,
  taskUpdateSchema,
  subtaskSchema,
  subtaskUpdateSchema,
  aiSearchSchema,
  aiDescriptionSchema,
};
