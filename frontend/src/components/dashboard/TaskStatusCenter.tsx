import type { Task } from "../../types";
import { getSubtaskStoryPoints, getTaskStoryPoints } from "../../lib/storyPoints";

interface TaskStatusCenterProps {
  tasks: Task[];
}

function toneForStatus(status: Task["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
    case "REVIEW":
      return "border-amber-500/20 bg-amber-500/10 text-amber-100";
    case "COMPLETED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100";
    case "TODO":
    default:
      return "border-slate-700 bg-slate-900 text-slate-100";
  }
}

function labelForStatus(status: Task["status"]) {
  return status.replace("_", " ");
}

function getSubtaskStatus(subtask: Task["subtasks"][number]): Task["status"] {
  return subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
}

export function TaskStatusCenter({ tasks }: TaskStatusCenterProps) {
  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Task Status Center</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          View every main task and subtask with their current workflow status, owner, story points, and due date in one place.
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneForStatus(task.status)}`}>
                    {labelForStatus(task.status)}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                    Main Task
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{task.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[340px]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Owner</p>
                  <p className="mt-2 text-sm text-slate-100">{task.assignee?.name || "Unassigned"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Story Points</p>
                  <p className="mt-2 text-sm text-slate-100">{getTaskStoryPoints(task)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Priority</p>
                  <p className="mt-2 text-sm text-slate-100">{task.priority}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Due Date</p>
                  <p className="mt-2 text-sm text-slate-100">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Subtasks</p>
                <span className="text-xs text-slate-400">{task.subtasks.length} items</span>
              </div>

              {task.subtasks.length ? (
                <div className="space-y-3">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneForStatus(
                                getSubtaskStatus(subtask)
                              )}`}
                            >
                              {labelForStatus(getSubtaskStatus(subtask))}
                            </span>
                            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                              {subtask.source}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-medium text-slate-100">{subtask.title}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Points</p>
                            <p className="mt-1 text-sm text-slate-100">{getSubtaskStoryPoints(task, subtask.id)}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Due</p>
                            <p className="mt-1 text-sm text-slate-100">
                              {subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString() : "Not set"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Complete</p>
                            <p className="mt-1 text-sm text-slate-100">{subtask.completed ? "Yes" : "No"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-6 text-sm text-slate-400">
                  No subtasks yet for this task.
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
