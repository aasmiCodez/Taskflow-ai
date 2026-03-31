import { useEffect } from "react";
import { getSubtaskStoryPoints, getTaskStoryPoints } from "../../lib/storyPoints";
import type { Task } from "../../types";

interface TaskDetailSheetProps {
  task: Task;
  onClose: () => void;
}

function toneForStatus(status: Task["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
    case "REVIEW":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "COMPLETED":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "TODO":
    default:
      return "border-slate-600 bg-slate-900 text-slate-100";
  }
}

function toneForPriority(priority: Task["priority"]) {
  switch (priority) {
    case "LOW":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "HIGH":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "URGENT":
      return "border-orange-400/30 bg-orange-400/10 text-orange-100";
    case "MEDIUM":
    default:
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }
}

function printStatus(status: Task["status"]) {
  return status.replace("_", " ");
}

function getSubtaskStatus(subtask: Task["subtasks"][number]): Task["status"] {
  return subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not recorded yet";
}

export function TaskDetailSheet({ task, onClose }: TaskDetailSheetProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/80 backdrop-blur-md">
      <button
        aria-label="Close task detail"
        className="flex-1 cursor-default"
        onClick={onClose}
        type="button"
      />

      <section className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98)_0%,_rgba(2,6,23,0.98)_100%)] shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_28%),radial-gradient(circle_at_20%_80%,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_85%_15%,_rgba(56,189,248,0.14),_transparent_25%)]" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Task Detail</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{task.title}</h2>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6 shadow-lg shadow-slate-950/30">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${toneForStatus(task.status)}`}>
                  {printStatus(task.status)}
                </span>
                <span className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${toneForPriority(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100">
                  {getTaskStoryPoints(task)} Points
                </span>
              </div>

              <p className="mt-6 text-base leading-8 text-slate-200">{task.description}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Assigned To</p>
                  <p className="mt-3 text-lg font-semibold text-white">{task.assignee?.name || "Unassigned"}</p>
                  <p className="mt-1 text-sm text-slate-400">{task.assignee?.role || "No current owner"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Created By</p>
                  <p className="mt-3 text-lg font-semibold text-white">{task.createdBy?.name || "Unknown"}</p>
                  <p className="mt-1 text-sm text-slate-400">{task.createdBy?.role || "Task creator"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Due Date</p>
                  <p className="mt-3 text-lg font-semibold text-white">{formatDate(task.dueDate)}</p>
                  <p className="mt-1 text-sm text-slate-400">{task.dueDate ? "Scheduled delivery date" : "No deadline yet"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Subtasks</p>
                  <p className="mt-3 text-lg font-semibold text-white">{task.subtasks.length}</p>
                  <p className="mt-1 text-sm text-slate-400">Detailed execution items under this main task</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Delivery Snapshot</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Progress Stage</p>
                  <p className="mt-2 text-2xl font-bold text-white">{printStatus(task.status)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Completed Subtasks</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {task.subtasks.filter((subtask) => getSubtaskStatus(subtask) === "COMPLETED").length}
                    <span className="ml-2 text-base font-medium text-slate-400">/ {task.subtasks.length}</span>
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Owner</p>
                  <p className="mt-2 text-xl font-bold text-white">{task.assignee?.name || "Unassigned"}</p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/65 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Timeline</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Workflow History</h3>
              </div>
              <p className="text-sm text-slate-400">See when the task was created, started, reviewed, updated, and completed.</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Created</p>
                <p className="mt-3 text-sm font-semibold text-white">{formatDateTime(task.createdAt)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Started</p>
                <p className="mt-3 text-sm font-semibold text-white">{formatDateTime(task.startedAt)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Moved To Review</p>
                <p className="mt-3 text-sm font-semibold text-white">{formatDateTime(task.reviewAt)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Last Updated</p>
                <p className="mt-3 text-sm font-semibold text-white">{formatDateTime(task.updatedAt)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Completed</p>
                <p className="mt-3 text-sm font-semibold text-white">{formatDateTime(task.completedAt)}</p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/65 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Subtask Breakdown</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Execution Trail</h3>
              </div>
              <p className="text-sm text-slate-400">Every subtask is shown with status, points, source, and due date.</p>
            </div>

            {task.subtasks.length ? (
              <div className="mt-6 space-y-4">
                {task.subtasks.map((subtask, index) => {
                  const status = getSubtaskStatus(subtask);

                  return (
                    <article key={subtask.id} className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.94)_0%,_rgba(15,23,42,0.72)_100%)] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                              Step {index + 1}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${toneForStatus(status)}`}>
                              {printStatus(status)}
                            </span>
                            <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-100">
                              {subtask.source}
                            </span>
                          </div>
                          <h4 className="mt-4 text-lg font-semibold text-white">{subtask.title}</h4>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Story Points</p>
                            <p className="mt-2 text-sm font-semibold text-white">{getSubtaskStoryPoints(task, subtask.id)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Due Date</p>
                            <p className="mt-2 text-sm font-semibold text-white">{formatDate(subtask.dueDate)}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Completed</p>
                            <p className="mt-2 text-sm font-semibold text-white">{subtask.completed ? "Yes" : "No"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Created</p>
                          <p className="mt-2 text-sm font-semibold text-white">{formatDateTime(subtask.createdAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Started</p>
                          <p className="mt-2 text-sm font-semibold text-white">{formatDateTime(subtask.startedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Review</p>
                          <p className="mt-2 text-sm font-semibold text-white">{formatDateTime(subtask.reviewAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Updated</p>
                          <p className="mt-2 text-sm font-semibold text-white">{formatDateTime(subtask.updatedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Completed</p>
                          <p className="mt-2 text-sm font-semibold text-white">{formatDateTime(subtask.completedAt)}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-[26px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-400">
                No subtasks yet for this task.
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
