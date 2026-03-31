export type UserRole = "ADMIN" | "PMO" | "MANAGER" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string | null;
  passwordSetupRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamUser extends User {
  manager?: User | null;
  _count?: {
    assignedTasks: number;
    createdTasks: number;
  };
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  source: string;
  status: TaskStatus;
  storyPoints: number;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  reviewAt?: string | null;
  completedAt?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  reviewAt?: string | null;
  completedAt?: string | null;
  createdBy: User | null;
  assignee: User | null;
  subtasks: Subtask[];
}

export interface DashboardStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks?: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  tasks: Task[];
}

export interface AiSearchResult {
  score: number;
  task: Task;
}

export interface AuthResponse {
  token?: string;
  user: User;
  requiresPasswordSetup?: boolean;
  setupToken?: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiMessageResponse {
  message?: string;
  error?: string;
}

export interface FlashMessage {
  type: "success" | "error";
  message: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  priority: TaskPriority;
  storyPoints: number;
  assigneeId: string | null;
  dueDate: string | null;
  autoGenerateSubtasks?: boolean;
}

export interface DescriptionDraftPayload {
  title: string;
  priority: TaskPriority;
  context?: string;
}

export interface AiDescriptionResponse {
  source: "openai" | "fallback";
  description: string;
  warning?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  managerId?: string | null;
}

export interface UpdateUserPayload {
  name?: string;
  password?: string;
  role?: UserRole;
  managerId?: string | null;
}
