import { FormEvent, useState } from "react";
import type { Task, TaskStatus, TeamUser, User } from "../../types";
import { getTaskStoryPoints } from "../../lib/storyPoints";

interface TaskCardProps {
  currentUser: User;
  task: Task;
  assignableUsers: TeamUser[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onAssign: (taskId: string, assigneeId: string | null) => void;
  onDelete: (taskId: string) => void;
  onGenerateSubtasks: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDragStart: (taskId: string) => void;
}

const statusFlow: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

const priorityTone = {
  LOW: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
  MEDIUM: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  HIGH: "border-rose-500/20 bg-rose-500/10 text-rose-100",
  URGENT: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100",
};

function getSubtaskStatus(subtask: Task["subtasks"][number]): TaskStatus {
  return subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
}

export function TaskCard({
  currentUser,
  task,
  assignableUsers,
  onStatusChange,
  onAssign,
  onDelete,
  onGenerateSubtasks,
  onAddSubtask,
  onDragStart,
}: TaskCardProps) {
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [assigneeDraft, setAssigneeDraft] = useState(task.assignee?.id || "");
  const totalStoryPoints = getTaskStoryPoints(task);
  const isAssignee = task.assignee?.id === currentUser.id;
  const isCreator = task.createdBy?.id === currentUser.id;
  const isAdmin = currentUser.role === "ADMIN";
  const isPmo = currentUser.role === "PMO";
  const isManager = currentUser.role === "MANAGER";
  const canManageTask = isAdmin || isPmo || isManager;
  const canMoveTask = canManageTask || isAssignee;
  const canManageSubtasks = isAdmin || isPmo || isManager;
  const canDeleteTask = isAdmin || isPmo || (isManager && isCreator);
  const canUseAi = isAdmin || isPmo || isManager;
  const currentIndex = statusFlow.indexOf(task.status);

  function handleAddSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subtaskTitle.trim()) return;
    onAddSubtask(task.id, subtaskTitle.trim());
    setSubtaskTitle("");
  }

  function handleAssign() {
    onAssign(task.id, assigneeDraft || null);
  }

  return (
    <article
      className="rounded-3xl border border-slate-800 bg-slate-950/95 p-3 shadow-lg shadow-slate-950/30"
      draggable={canMoveTask}
      onDragStart={() => onDragStart(task.id)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
          {totalStoryPoints} pts
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">{task.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{task.description}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-2 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Assigned To</p>
          <p className="mt-1 text-xs font-semibold text-white">{task.assignee?.name || "Unassigned"}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
            {task.assignee ? task.assignee.role : "No owner yet"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-2 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Due Date</p>
          <p className="mt-1 text-xs font-semibold text-white">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
            {task.dueDate ? "Scheduled" : "Planning needed"}
          </p>
        </div>
      </div>

      {canManageTask ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Assign Main Task</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                onChange={(event) => setAssigneeDraft(event.target.value)}
                value={assigneeDraft}
              >
                <option value="">Unassigned</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                disabled={(task.assignee?.id || "") === assigneeDraft}
                onClick={handleAssign}
                type="button"
              >
                Save Assignee
              </button>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Subtasks follow the main task owner in this board, so assigning the parent task makes the work belong to that same person.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {canMoveTask && currentIndex < statusFlow.length - 1 ? (
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            onClick={() => onStatusChange(task.id, statusFlow[currentIndex + 1])}
            type="button"
          >
            Move to {statusFlow[currentIndex + 1].replace("_", " ")}
          </button>
        ) : null}
        {canUseAi ? (
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            onClick={() => onGenerateSubtasks(task.id)}
            type="button"
          >
            AI Subtasks
          </button>
        ) : null}
        {canDeleteTask ? (
          <button
            className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
            onClick={() => onDelete(task.id)}
            type="button"
          >
            Delete
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Subtask workflow</p>
          <span className="text-xs text-slate-300">{task.subtasks.length} items</span>
        </div>
        <div className="mt-3 space-y-2">
          {task.subtasks.slice(0, 3).map((subtask) => (
            <div key={subtask.id} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm text-slate-100">{subtask.title}</p>
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{getSubtaskStatus(subtask).replace("_", " ")}</span>
              </div>
            </div>
          ))}
          {task.subtasks.length > 3 ? (
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Additional subtasks continue in the board lanes.</p>
          ) : null}
        </div>
      </div>

      {canManageSubtasks ? (
        <form className="mt-4 flex gap-3" onSubmit={handleAddSubtask}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
            onChange={(event) => setSubtaskTitle(event.target.value)}
            placeholder="Add manual subtask"
            value={subtaskTitle}
          />
          <button className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800" type="submit">
            Add
          </button>
        </form>
      ) : null}
    </article>
  );
}
