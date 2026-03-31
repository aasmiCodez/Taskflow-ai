import type { Subtask, TaskStatus, User } from "../../types";

interface SubtaskCardProps {
  currentUser: User;
  taskTitle: string;
  taskAssignee: User | null;
  storyPoints: number;
  subtask: Subtask;
  onDeleteSubtask: (subtaskId: string) => void;
  onStatusChange: (subtaskId: string, status: TaskStatus) => void;
  onDragStart: (subtaskId: string) => void;
}

const statusFlow: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

function getSubtaskStatus(subtask: Subtask): TaskStatus {
  return subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
}

export function SubtaskCard({
  currentUser,
  taskTitle,
  taskAssignee,
  storyPoints,
  subtask,
  onDeleteSubtask,
  onStatusChange,
  onDragStart,
}: SubtaskCardProps) {
  const isAssignee = taskAssignee?.id === currentUser.id;
  const canAdminister = currentUser.role === "ADMIN" || currentUser.role === "PMO" || currentUser.role === "MANAGER";
  const canMove = canAdminister || isAssignee;
  const currentStatus = getSubtaskStatus(subtask);
  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <article
      className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-slate-950/30"
      draggable={canMove}
      onDragStart={() => onDragStart(subtask.id)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Subtask
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
          {storyPoints} pts
        </span>
      </div>

      <h4 className="mt-4 text-base font-bold text-white">{subtask.title}</h4>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">Parent task: {taskTitle}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
        Assigned to: {taskAssignee?.name || "Unassigned"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
        <span>{subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString() : "No due date"}</span>
        <span>{subtask.source}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canMove && currentIndex < statusFlow.length - 1 ? (
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            onClick={() => onStatusChange(subtask.id, statusFlow[currentIndex + 1])}
            type="button"
          >
            Move to {statusFlow[currentIndex + 1].replace("_", " ")}
          </button>
        ) : null}

        {canAdminister ? (
          <button
            className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
            onClick={() => onDeleteSubtask(subtask.id)}
            type="button"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}
