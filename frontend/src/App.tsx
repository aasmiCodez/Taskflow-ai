import { useEffect, useRef, useState } from "react";
import { LoginScreen } from "./components/auth/LoginScreen";
import { PasswordSetupScreen } from "./components/auth/PasswordSetupScreen";
import { AiSearchPanel } from "./components/dashboard/AiSearchPanel";
import { DeliveryCharts } from "./components/dashboard/DeliveryCharts";
import { ExportCenter } from "./components/dashboard/ExportCenter";
import { MetricCard } from "./components/dashboard/MetricCard";
import { PermissionsMatrix } from "./components/dashboard/PermissionsMatrix";
import { ScheduleCenter } from "./components/dashboard/ScheduleCenter";
import { SettingsModal, type ThemeChoice } from "./components/dashboard/SettingsModal";
import { SidebarNav } from "./components/dashboard/SidebarNav";
import { TaskBoard } from "./components/dashboard/TaskBoard";
import { TaskComposer } from "./components/dashboard/TaskComposer";
import { TaskStatusCenter } from "./components/dashboard/TaskStatusCenter";
import { TeamManagementPanel } from "./components/dashboard/TeamManagementPanel";
import { TopBar } from "./components/dashboard/TopBar";
import { UserHierarchyModal } from "./components/dashboard/UserHierarchyModal";
import { apiRequest, getErrorMessage } from "./lib/api";
import { getTaskStoryPoints } from "./lib/storyPoints";
import type {
  AiDescriptionResponse,
  AiSearchResult,
  AuthResponse,
  CreateTaskPayload,
  CreateUserPayload,
  DashboardResponse,
  DashboardStats,
  DescriptionDraftPayload,
  FlashMessage,
  MessageResponse,
  Task,
  TaskStatus,
  TeamUser,
  UpdateUserPayload,
  User,
} from "./types";

type ModuleId = "overview" | "users" | "tasks" | "schedule" | "assignments" | "reports";
type AuthView = "login" | "setup" | "reset";

const emptyStats: DashboardStats = {
  totalTasks: 0,
  todoTasks: 0,
  inProgressTasks: 0,
  reviewTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  teamMembers: 0,
};

const moduleMeta: Record<ModuleId, { title: string; description: string }> = {
  overview: {
    title: "CRM Overview",
    description: "Review delivery health, charts, permissions, AI search, and the current status of your team's execution pipeline.",
  },
  users: {
    title: "User CRM",
    description: "Create and manage admins, managers, and members while tracking access and assigned workload.",
  },
  tasks: {
    title: "Taskdrome",
    description: "Move cards across Jira-style workflow lanes, update subtasks, and keep delivery moving through review.",
  },
  schedule: {
    title: "Schedule Hub",
    description: "View all tasks, due dates, owners, and deadline pressure in one planner-style workspace.",
  },
  assignments: {
    title: "Assignment Desk",
    description: "Create main tasks, assign owners, and use AI to generate subtasks, story points, and due dates automatically.",
  },
  reports: {
    title: "Reports & Exports",
    description: "Review charts, export the portfolio for Excel, and open a print-ready PDF view for reporting.",
  },
};

const themeBackgrounds: Record<ThemeChoice, string> = {
  aurora:
    "bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_25%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)]",
  sunset:
    "bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_25%),linear-gradient(180deg,_#111827_0%,_#3b0764_55%,_#431407_100%)]",
  forest:
    "bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.14),_transparent_25%),linear-gradient(180deg,_#052e16_0%,_#14532d_55%,_#111827_100%)]",
};

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function printStatus(status: TaskStatus) {
  return status.replace("_", " ");
}

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const credentialMode = searchParams.get("mode");
  const credentialToken = searchParams.get("token");
  const [user, setUser] = useState<User | null>(null);
  const [passwordSetupUser, setPasswordSetupUser] = useState<User | null>(null);
  const [passwordSetupToken, setPasswordSetupToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authInfoMessage, setAuthInfoMessage] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [searchSummary, setSearchSummary] = useState("");
  const [searchResults, setSearchResults] = useState<AiSearchResult[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [authView, setAuthView] = useState<AuthView>(
    credentialToken && credentialMode === "reset"
      ? "reset"
      : credentialToken && credentialMode === "setup"
        ? "setup"
        : "login"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>(() => (localStorage.getItem("taskflow-theme") as ThemeChoice) || "aurora");
  const flashTimerRef = useRef<number | null>(null);

  const canManageTasks = user?.role === "ADMIN" || user?.role === "PMO" || user?.role === "MANAGER";
  const canManageUsers = user?.role === "ADMIN";
  const canViewUsers = user?.role === "ADMIN" || user?.role === "PMO" || user?.role === "MANAGER";
  const canUseGenerativeAi = user?.role === "ADMIN" || user?.role === "PMO" || user?.role === "MANAGER";

  useEffect(() => {
    async function bootstrap() {
      if (!token) return;

      try {
        const meResponse = await apiRequest<{ user: User }>("/api/auth/me", { accessToken: token });
        setUser(meResponse.user);

        const [dashboard, userList] = await Promise.all([
          apiRequest<DashboardResponse>("/api/dashboard", {
            accessToken: token,
          }),
          meResponse.user.role === "MEMBER"
            ? Promise.resolve({ users: [] as TeamUser[] })
            : apiRequest<{ users: TeamUser[] }>("/api/users", { accessToken: token }),
        ]);

        setTasks(dashboard.tasks);
        setStats(dashboard.stats);
        setUsers(userList.users);
      } catch (_error) {
        resetSession();
      }
    }

    bootstrap();
  }, [token]);

  useEffect(() => {
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  function resetSession() {
    setUser(null);
    setPasswordSetupUser(null);
    setPasswordSetupToken(null);
    setLoginError(null);
    setAuthInfoMessage(null);
    setAuthView(
      credentialToken && credentialMode === "reset"
        ? "reset"
        : credentialToken && credentialMode === "setup"
          ? "setup"
          : "login"
    );
    setToken(null);
    setTasks([]);
    setStats(emptyStats);
    setUsers([]);
    setSearchSummary("");
    setSearchResults([]);
    setActiveModule("overview");
    setSidebarCollapsed(true);
    localStorage.removeItem("accessToken");
  }

  function showFlash(type: FlashMessage["type"], message: string) {
    setFlash({ type, message });
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 3500);
  }

  async function refreshDashboard() {
    if (!token) return;
    const dashboard = await apiRequest<DashboardResponse>("/api/dashboard", { accessToken: token });
    setTasks(dashboard.tasks);
    setStats(dashboard.stats);
  }

  async function refreshUsers(role = user?.role) {
    if (!token || !role || role === "MEMBER") {
      setUsers([]);
      return;
    }

    const userList = await apiRequest<{ users: TeamUser[] }>("/api/users", { accessToken: token });
    setUsers(userList.users);
  }

  async function handleLogin(credentials: { email: string; password: string }) {
    try {
      setLoginError(null);
      setAuthInfoMessage(null);
      const response = await apiRequest<AuthResponse>("/api/auth/login", {
        body: credentials,
      });

      if (response.requiresPasswordSetup && response.setupToken) {
        setPasswordSetupUser(response.user);
        setPasswordSetupToken(response.setupToken);
        setAuthView("setup");
        setActiveModule("overview");
        showFlash("success", "Set a new password to activate this account.");
        return;
      }

      localStorage.setItem("accessToken", response.token!);
      setToken(response.token!);
      setUser(response.user);
      setAuthView("login");
      setActiveModule("overview");
      showFlash("success", "Login successful.");
    } catch (error: any) {
      setLoginError(error?.message || "Invalid email or password.");
    }
  }

  async function handleSetupPassword(password: string, confirmPassword: string) {
    const activeSetupToken = passwordSetupToken || (credentialMode === "setup" ? credentialToken : null);

    if (!activeSetupToken) {
      showFlash("error", "Password setup session expired. Please log in again.");
      return;
    }

    if (password !== confirmPassword) {
      showFlash("error", "Passwords do not match.");
      return;
    }

    try {
      const response = await apiRequest<AuthResponse>("/api/auth/setup-password", {
        method: "POST",
        body: {
          setupToken: activeSetupToken,
          password,
        },
      });

      window.history.replaceState({}, "", window.location.pathname);
      localStorage.setItem("accessToken", response.token!);
      setToken(response.token!);
      setUser(response.user);
      setPasswordSetupUser(null);
      setPasswordSetupToken(null);
      setAuthView("login");
      setActiveModule("overview");
      showFlash("success", "Password created successfully.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not save password.");
    }
  }

  async function handleForgotPassword(email: string) {
    try {
      const response = await apiRequest<MessageResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setLoginError(null);
      setAuthInfoMessage(response.message);
    } catch (error: any) {
      setLoginError(error?.message || "Could not request a password reset.");
    }
  }

  async function handleResetPassword(password: string, confirmPassword: string) {
    if (!credentialToken) {
      showFlash("error", "Password reset link is missing or invalid.");
      return;
    }

    if (password !== confirmPassword) {
      showFlash("error", "Passwords do not match.");
      return;
    }

    try {
      const response = await apiRequest<AuthResponse>("/api/auth/reset-password", {
        method: "POST",
        body: {
          token: credentialToken,
          password,
        },
      });

      window.history.replaceState({}, "", window.location.pathname);
      localStorage.setItem("accessToken", response.token!);
      setToken(response.token!);
      setUser(response.user);
      setAuthView("login");
      setAuthInfoMessage(null);
      showFlash("success", "Password reset successful.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not reset password.");
    }
  }

  function handleLogout() {
    resetSession();
  }

  async function handleSaveSettings(payload: { name: string; password?: string; theme: ThemeChoice }) {
    if (!token) return;

    try {
      const response = await apiRequest<{ user: User }>("/api/auth/me", {
        method: "PATCH",
        accessToken: token,
        body: {
          name: payload.name,
          ...(payload.password ? { password: payload.password } : {}),
        },
      });

      setUser(response.user);
      setUsers((current) => current.map((entry) => (entry.id === response.user.id ? { ...entry, ...response.user } : entry)));
      setTheme(payload.theme);
      setSettingsOpen(false);
      showFlash("success", "Settings updated.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not update settings.");
    }
  }

  async function handleCreateTask(payload: CreateTaskPayload) {
    try {
      await apiRequest<{ task: Task }>("/api/tasks", {
        method: "POST",
        accessToken: token,
        body: payload,
      });

      await refreshDashboard();
      setActiveModule("tasks");
      showFlash("success", "Task created successfully.");
    } catch (error: any) {
      showFlash("error", error?.message || "Task creation failed.");
    }
  }

  async function handleGenerateDescription(payload: DescriptionDraftPayload) {
    const response = await apiRequest<AiDescriptionResponse>("/api/ai/description", {
      method: "POST",
      accessToken: token,
      body: payload,
    });

    showFlash(
      "success",
      response.source === "openai" ? "AI description draft generated." : "Fallback description draft generated."
    );
    return response.description;
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        accessToken: token,
        body: { status },
      });
      await refreshDashboard();
      showFlash("success", "Task status updated.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not update status.");
    }
  }

  async function handleAssign(taskId: string, assigneeId: string | null) {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        accessToken: token,
        body: { assigneeId },
      });
      await refreshDashboard();
      showFlash("success", assigneeId ? "Task assigned." : "Task unassigned.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not assign task.");
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: "DELETE",
        accessToken: token,
      });
      await refreshDashboard();
      showFlash("success", "Task deleted.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not delete task.");
    }
  }

  async function handleDeleteAllTasks() {
    const message =
      user?.role === "MANAGER"
        ? "Delete all tasks you created? This will also remove their subtasks."
        : "Delete all tasks in this workspace view? This will also remove their subtasks.";

    if (!window.confirm(message)) {
      return;
    }

    try {
      const response = await apiRequest<{ deletedCount: number }>("/api/tasks", {
        method: "DELETE",
        accessToken: token,
      });
      await refreshDashboard();
      showFlash(
        "success",
        response.deletedCount > 0 ? `${response.deletedCount} task(s) deleted.` : "No tasks were available to delete."
      );
    } catch (error: any) {
      showFlash("error", error?.message || "Could not delete tasks.");
    }
  }

  async function handleGenerateSubtasks(taskId: string) {
    try {
      await apiRequest(`/api/ai/tasks/${taskId}/subtasks`, {
        method: "POST",
        accessToken: token,
      });
      await refreshDashboard();
      showFlash("success", "AI subtasks generated.");
    } catch (error: any) {
      showFlash("error", error?.message || "AI subtasks generation failed.");
    }
  }

  async function handleAddSubtask(taskId: string, title: string) {
    try {
      await apiRequest(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        accessToken: token,
        body: { title },
      });
      await refreshDashboard();
      showFlash("success", "Subtask added.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not add subtask.");
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    try {
      await apiRequest(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
        accessToken: token,
      });
      await refreshDashboard();
      showFlash("success", "Subtask deleted.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not delete subtask.");
    }
  }

  async function handleSubtaskStatusChange(subtaskId: string, status: TaskStatus) {
    try {
      await apiRequest(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        accessToken: token,
        body: { status },
      });
      await refreshDashboard();
      showFlash("success", "Subtask status updated.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not update subtask status.");
    }
  }

  async function handleSearch(query: string) {
    if (!query.trim()) {
      setSearchSummary("Enter a query to search tasks.");
      setSearchResults([]);
      return;
    }

    try {
      const searchResponse = await apiRequest<{ summary: string; results: AiSearchResult[] }>("/api/ai/search", {
        method: "POST",
        accessToken: token,
        body: { query },
      });
      setSearchSummary(searchResponse.summary);
      setSearchResults(searchResponse.results);
    } catch (error: any) {
      showFlash("error", error?.message || "AI search failed.");
    }
  }

  async function handleCreateUser(payload: CreateUserPayload) {
    try {
      setCreateUserError(null);
      const response = await apiRequest<{ emailDelivery: string; setupLink?: string }>("/api/users", {
        method: "POST",
        accessToken: token,
        body: payload,
      });
      await refreshUsers("ADMIN");
      await refreshDashboard();
      let message =
        response.emailDelivery === "smtp"
          ? "User created and onboarding email sent."
          : "User created, but SMTP is not configured, so the setup email could not be sent yet.";

      if (response.emailDelivery === "failed") {
        let copied = false;

        if (response.setupLink && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(response.setupLink);
            copied = true;
          } catch (_error) {
            copied = false;
          }
        }

        message = copied
          ? "User created, but onboarding email delivery failed. The one-time setup link has been copied to your clipboard."
          : "User created, but onboarding email delivery failed. Check the backend response logs and fix SMTP before resending access.";
      }

      showFlash("success", message);
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not create user.");
      setCreateUserError(message);
      showFlash("error", message);
    }
  }

  async function handleUpdateUser(userId: string, payload: UpdateUserPayload) {
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: "PATCH",
        accessToken: token,
        body: payload,
      });
      await refreshUsers("ADMIN");
      await refreshDashboard();
      showFlash("success", "User updated.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not update user.");
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: "DELETE",
        accessToken: token,
      });
      await refreshUsers("ADMIN");
      await refreshDashboard();
      showFlash("success", "User removed.");
    } catch (error: any) {
      showFlash("error", error?.message || "Could not remove user.");
    }
  }

  function handleExportCsv() {
    const rows = [
      ["Title", "Owner", "Created By", "Priority", "Status", "Story Points", "Subtasks", "Due Date"],
      ...tasks.map((task) => [
        task.title,
        task.assignee?.name || "Unassigned",
        task.createdBy?.name || "Unknown",
        task.priority,
        printStatus(task.status),
        String(getTaskStoryPoints(task)),
        String(task.subtasks.length),
        task.dueDate ? new Date(task.dueDate).toLocaleString() : "Not set",
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "taskflow-report.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function handleExportPdf() {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      showFlash("error", "Popup blocked. Allow popups to export PDF.");
      return;
    }

    const rows = tasks
      .map(
        (task) => `
          <tr>
            <td>${task.title}</td>
            <td>${task.assignee?.name || "Unassigned"}</td>
            <td>${task.priority}</td>
            <td>${printStatus(task.status)}</td>
            <td>${getTaskStoryPoints(task)}</td>
            <td>${task.subtasks.length}</td>
            <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>TaskFlow AI Report</title>
        </head>
        <body>
          <h1>TaskFlow AI CRM Report</h1>
          <p>Generated from the dashboard export center.</p>
          <table border="1" cellspacing="0" cellpadding="8">
            <thead>
              <tr>
                <th>Task</th>
                <th>Owner</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Story Points</th>
                <th>Subtasks</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function renderOverview(currentUser: User) {
    const overviewCounts = tasks.reduce(
      (counts, task) => {
        counts.totalItems += 1;
        counts.todoItems += task.status === "TODO" ? 1 : 0;
        counts.reviewItems += task.status === "REVIEW" ? 1 : 0;
        counts.completedItems += task.status === "COMPLETED" ? 1 : 0;

        task.subtasks.forEach((subtask) => {
          const status = subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
          counts.totalItems += 1;
          if (status === "TODO") counts.todoItems += 1;
          if (status === "REVIEW") counts.reviewItems += 1;
          if (status === "COMPLETED") counts.completedItems += 1;
        });

        return counts;
      },
      {
        totalItems: 0,
        todoItems: 0,
        reviewItems: 0,
        completedItems: 0,
      }
    );

    return (
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Items" value={overviewCounts.totalItems} tone="brand" />
          <MetricCard label="In Review" value={overviewCounts.reviewItems} tone="amber" />
          <MetricCard label="Completed" value={overviewCounts.completedItems} tone="emerald" />
          <MetricCard label="Team Members" value={stats.teamMembers} tone="brand" />
        </section>

        <DeliveryCharts stats={stats} tasks={tasks} />

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <PermissionsMatrix />

          <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
            <h2 className="text-xl font-bold text-white">Workspace Summary</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              You are signed in as {currentUser.role}. Use the left navigation to manage users, create AI-assisted work,
              move cards through review, and export delivery reports.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Identity</p>
                <p className="mt-2 text-lg font-semibold text-white">{currentUser.name}</p>
                <p className="mt-1 text-sm text-slate-400">{currentUser.email}</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AI Planning</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Main tasks can generate subtasks, assign story points, and propose due dates to mirror a Jira-style planning flow.
                </p>
              </div>
            </div>
          </section>
        </div>

        <AiSearchPanel onSearch={handleSearch} results={searchResults} summary={searchSummary} />
      </div>
    );
  }

  function renderUsers() {
    return canViewUsers ? (
      <TeamManagementPanel
        users={users}
        currentUserId={user!.id}
        canManage={canManageUsers}
        createUserError={createUserError}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
      />
    ) : (
      <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
        <h2 className="text-xl font-bold text-white">User CRM</h2>
        <p className="mt-2 text-sm leading-5 text-slate-300">This module is available to PMO, managers, and admins only.</p>
      </section>
    );
  }

  function renderTasks(currentUser: User) {
    const taskdromeCounts = tasks.reduce(
      (counts, task) => {
        counts[task.status] += 1;

        task.subtasks.forEach((subtask) => {
          const subtaskStatus = subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
          counts[subtaskStatus] += 1;
        });

        return counts;
      },
      {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        COMPLETED: 0,
      } as Record<TaskStatus, number>
    );

    const assignableUsers = users.filter((teamUser) => {
      if (!currentUser) return false;
      if (currentUser.role === "ADMIN" || currentUser.role === "PMO") {
        return teamUser.role === "MANAGER" || teamUser.role === "MEMBER";
      }
      if (currentUser.role === "MANAGER") {
        return teamUser.id === currentUser.id || (teamUser.role === "MEMBER" && teamUser.managerId === currentUser.id);
      }
      return false;
    });

    return (
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="To Do" value={taskdromeCounts.TODO} tone="amber" />
          <MetricCard label="In Progress" value={taskdromeCounts.IN_PROGRESS} tone="brand" />
          <MetricCard label="Review" value={taskdromeCounts.REVIEW} tone="amber" />
          <MetricCard label="Completed" value={taskdromeCounts.COMPLETED} tone="emerald" />
        </section>

        <TaskBoard
          currentUser={currentUser}
          tasks={tasks}
          assignableUsers={assignableUsers}
          onAddSubtask={handleAddSubtask}
          onAssign={handleAssign}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAllTasks}
          onDeleteSubtask={handleDeleteSubtask}
          onGenerateSubtasks={handleGenerateSubtasks}
          onInvalidMove={(message) => showFlash("error", message)}
          onStatusChange={handleStatusChange}
          onSubtaskStatusChange={handleSubtaskStatusChange}
        />

        <TaskStatusCenter tasks={tasks} />
      </div>
    );
  }

  function renderAssignments() {
    const assignableUsers = users.filter((teamUser) => {
      if (!user) return false;
      if (user.role === "ADMIN" || user.role === "PMO") {
        return teamUser.role === "MANAGER" || teamUser.role === "MEMBER";
      }
      if (user.role === "MANAGER") {
        return teamUser.id === user.id || (teamUser.role === "MEMBER" && teamUser.managerId === user.id);
      }
      return false;
    });

    return canManageTasks ? (
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <TaskComposer
            users={assignableUsers}
            onCreateTask={handleCreateTask}
            onGenerateDescription={handleGenerateDescription}
            canUseAi={canUseGenerativeAi}
          />

          <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
            <h2 className="text-xl font-bold text-white">AI Planning Rules</h2>
            <p className="mt-1 text-sm leading-5 text-slate-300">
              Auto-generation creates Jira-style subtasks beneath the main task, assigns story points, and proposes due dates that
              fit the task timeline.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Story Points</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Main task points now roll up from the total of all subtask estimates.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Due Dates</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Generated subtasks receive due dates so the team can sequence work clearly.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workflow</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Tasks move through To Do, In Progress, Review, and Completed like Jira.</p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-xl font-bold text-white">Assignment Playbook</h2>
          <p className="mt-1 text-sm leading-5 text-slate-300">
            Create the main task here, assign an owner, then let the board and reports modules take over the execution flow.
          </p>

          <div className="mt-5 space-y-4">
            {users.map((teamUser) => (
              <div key={teamUser.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{teamUser.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{teamUser.role}</p>
                  </div>
                  <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
                    {teamUser._count?.assignedTasks ?? 0} assigned
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    ) : (
      <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
        <h2 className="text-xl font-bold text-white">Assignment Desk</h2>
        <p className="mt-1 text-sm leading-5 text-slate-300">Task assignment is available to admins, PMO, and managers only.</p>
      </section>
    );
  }

  function renderSchedule() {
    return <ScheduleCenter tasks={tasks} />;
  }

  function renderReports() {
    const scheduledTasks = tasks.filter((task) => Boolean(task.dueDate)).length;
    const unassignedTasks = tasks.filter((task) => !task.assignee).length;

    return (
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Exportable Tasks" value={stats.totalTasks} tone="brand" />
          <MetricCard label="Overdue Tasks" value={stats.overdueTasks} tone="rose" />
          <MetricCard label="Scheduled Tasks" value={scheduledTasks} tone="amber" />
          <MetricCard label="Unassigned Tasks" value={unassignedTasks} tone="amber" />
        </section>

        <ExportCenter tasks={tasks} onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />

        <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Reporting Notes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This module is focused on export readiness only. Workflow charts and task-status drilldowns stay in CRM Overview.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Source Of Truth</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Export counts are based on the same dashboard task dataset used elsewhere, but this screen avoids duplicating overview analytics blocks.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">CSV Export</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Use the CSV export for spreadsheets, filters, pivots, and operational reporting in Excel-compatible tools.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">PDF Export</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Use the PDF view for stakeholder sharing, snapshots, and print-ready reporting without the board analytics layer.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderModule(currentUser: User) {
    switch (activeModule) {
      case "users":
        return renderUsers();
      case "tasks":
        return renderTasks(currentUser);
      case "schedule":
        return renderSchedule();
      case "assignments":
        return renderAssignments();
      case "reports":
        return renderReports();
      case "overview":
      default:
        return renderOverview(currentUser);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        {authView === "reset" ? (
          <PasswordSetupScreen
            badgeLabel="Password Reset"
            description="Choose a new password for your account. The reset link expires automatically and can only be used once."
            onSubmit={handleResetPassword}
            submitLabel="Reset password"
            title="Reset your password"
            user={null}
          />
        ) : authView === "setup" ? (
          <PasswordSetupScreen
            badgeLabel="Account Setup"
            description={
              passwordSetupUser?.name
                ? `${passwordSetupUser.name}, choose your permanent password to activate your workspace access.`
                : "Choose your permanent password to activate your workspace access. Setup links expire automatically and can only be used once."
            }
            onSubmit={handleSetupPassword}
            submitLabel="Activate account"
            title="Create your password"
            user={passwordSetupUser}
          />
        ) : (
          <LoginScreen
            errorMessage={loginError}
            infoMessage={authInfoMessage}
            onForgotPassword={handleForgotPassword}
            onLogin={handleLogin}
          />
        )}
      </main>
    );
  }

  const currentModule = moduleMeta[activeModule];

  return (
    <main className={`h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 ${themeBackgrounds[theme]}`}>
      <div
        className={`mx-auto grid h-full w-full max-w-[1600px] gap-3 sm:gap-4 ${
          sidebarCollapsed ? "xl:grid-cols-[88px_minmax(0,1fr)]" : "xl:grid-cols-[320px_minmax(0,1fr)]"
        }`}
      >
        <SidebarNav
          activeModule={activeModule}
          collapsed={sidebarCollapsed}
          onSelect={setActiveModule}
          onToggle={() => setSidebarCollapsed((current) => !current)}
        />

        <section className="flex min-h-0 overflow-hidden flex-col gap-3 sm:gap-4">
          <TopBar
            canOpenHierarchy={canViewUsers && users.length > 0}
            description={currentModule.description}
            onOpenHierarchy={() => setHierarchyOpen(true)}
            onLogout={handleLogout}
            onOpenSettings={() => setSettingsOpen(true)}
            title={currentModule.title}
            user={user}
          />

          {flash ? (
            <div
              className={`rounded-3xl border px-5 py-4 text-sm ${
                flash.type === "success"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border-rose-400/20 bg-rose-500/10 text-rose-100"
              }`}
            >
              {flash.message}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-[30px] border border-slate-800/80 bg-slate-950/55 p-4 sm:p-5">
            {renderModule(user)}
          </div>
        </section>
      </div>

      {settingsOpen ? (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          theme={theme}
          user={user}
        />
      ) : null}

      {hierarchyOpen ? (
        <UserHierarchyModal currentUser={user} onClose={() => setHierarchyOpen(false)} users={users} />
      ) : null}
    </main>
  );
}
