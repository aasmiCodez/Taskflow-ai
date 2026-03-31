import type { Task } from "../../types";
import { getTaskStoryPoints } from "../../lib/storyPoints";

interface ScheduleCenterProps {
  tasks: Task[];
}

function formatStatus(status: Task["status"]) {
  return status.replace("_", " ");
}

function formatDueDate(dueDate?: string | null) {
  if (!dueDate) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dueDate));
}

function dueTone(task: Task) {
  if (!task.dueDate) {
    return "border-slate-800 bg-slate-950 text-slate-300";
  }

  const now = new Date();
  const due = new Date(task.dueDate);

  if (task.status === "COMPLETED") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100";
  }

  if (due < now) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-100";
  }

  const withinTwoDays = due.getTime() - now.getTime() <= 1000 * 60 * 60 * 48;
  if (withinTwoDays) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-100";
  }

  return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
}

function relativeDueLabel(dueDate?: string | null) {
  if (!dueDate) {
    return "Backlog";
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

export function ScheduleCenter({ tasks }: ScheduleCenterProps) {
  const sortedTasks = [...tasks].sort((left, right) => {
    if (!left.dueDate && !right.dueDate) return 0;
    if (!left.dueDate) return 1;
    if (!right.dueDate) return -1;
    return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
  });

  const dueToday = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const due = new Date(task.dueDate);
    return today.toDateString() === due.toDateString();
  }).length;

  const overdue = tasks.filter((task) => {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  }).length;

  const unscheduled = tasks.filter((task) => !task.dueDate).length;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Due Today</p>
          <p className="mt-3 text-3xl font-black text-white">{dueToday}</p>
        </div>
        <div className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Overdue</p>
          <p className="mt-2 text-2xl font-black text-rose-200">{overdue}</p>
        </div>
        <div className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">No Due Date</p>
          <p className="mt-2 text-2xl font-black text-slate-100">{unscheduled}</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Schedule Hub</h2>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              Review every task with its due date, owner, status, and delivery pressure in one modern planner view.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
            Sorted by nearest deadline first
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {sortedTasks.map((task) => (
              <article key={task.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                        {task.priority}
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                        {formatStatus(task.status)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${dueTone(task)}`}>
                        {relativeDueLabel(task.dueDate)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white">{task.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{task.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Due Date</p>
                      <p className="mt-2 text-sm text-slate-100">{formatDueDate(task.dueDate)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Owner</p>
                      <p className="mt-2 text-sm text-slate-100">{task.assignee?.name || "Unassigned"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Story Points</p>
                      <p className="mt-2 text-sm text-slate-100">{getTaskStoryPoints(task)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Subtasks</p>
                      <p className="mt-2 text-sm text-slate-100">{task.subtasks.length}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!sortedTasks.length ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/60 px-5 py-10 text-center text-sm text-slate-400">
                No tasks are available yet.
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-lg font-semibold text-white">Deadline Table</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A compact list for scanning every due date quickly.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold text-slate-100">Task</th>
                    <th className="pb-3 font-semibold text-slate-100">Due</th>
                    <th className="pb-3 font-semibold text-slate-100">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-800 last:border-b-0">
                      <td className="py-3 pr-4 text-slate-100">{task.title}</td>
                      <td className="py-3 pr-4 text-slate-300">{formatDueDate(task.dueDate)}</td>
                      <td className="py-3 text-slate-300">{task.assignee?.name || "Unassigned"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
