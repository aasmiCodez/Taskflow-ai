import type { DashboardStats, Task } from "../../types";
import { getTaskStoryPoints } from "../../lib/storyPoints";

interface DeliveryChartsProps {
  stats: DashboardStats;
  tasks: Task[];
}

const statusLabels = [
  { key: "todoTasks", label: "To Do", tone: "bg-slate-500" },
  { key: "inProgressTasks", label: "In Progress", tone: "bg-cyan-500" },
  { key: "reviewTasks", label: "Review", tone: "bg-amber-500" },
  { key: "completedTasks", label: "Completed", tone: "bg-emerald-500" },
] as const;

export function DeliveryCharts({ stats, tasks }: DeliveryChartsProps) {
  const workflowCounts = tasks.reduce(
    (counts, task) => {
      counts.todoTasks += task.status === "TODO" ? 1 : 0;
      counts.inProgressTasks += task.status === "IN_PROGRESS" ? 1 : 0;
      counts.reviewTasks += task.status === "REVIEW" ? 1 : 0;
      counts.completedTasks += task.status === "COMPLETED" ? 1 : 0;

      task.subtasks.forEach((subtask) => {
        const status = subtask.status || (subtask.completed ? "COMPLETED" : "TODO");
        if (status === "TODO") counts.todoTasks += 1;
        if (status === "IN_PROGRESS") counts.inProgressTasks += 1;
        if (status === "REVIEW") counts.reviewTasks += 1;
        if (status === "COMPLETED") counts.completedTasks += 1;
      });

      return counts;
    },
    {
      todoTasks: 0,
      inProgressTasks: 0,
      reviewTasks: 0,
      completedTasks: 0,
    }
  );

  const total =
    workflowCounts.todoTasks +
    workflowCounts.inProgressTasks +
    workflowCounts.reviewTasks +
    workflowCounts.completedTasks ||
    Math.max(1, stats.totalTasks);
  const storyPoints = tasks.reduce((sum, task) => sum + getTaskStoryPoints(task), 0);
  const completedStoryPoints = tasks
    .filter((task) => task.status === "COMPLETED")
    .reduce((sum, task) => sum + getTaskStoryPoints(task), 0);

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Delivery Charts</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Visualize workflow health, review load, and how many story points are already delivered.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {statusLabels.map((item) => {
            const value = Number(workflowCounts[item.key] || 0);
            const filledSegments = Math.max(1, Math.round((value / total) * 10));
            return (
              <div key={item.key}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-200">{item.label}</span>
                  <span className="text-slate-400">{value} tasks</span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={`${item.key}-${index}`}
                      className={`h-3 rounded-full ${index < filledSegments ? item.tone : "bg-slate-900"}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total Story Points</p>
            <p className="mt-3 text-4xl font-black text-white">{storyPoints}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Delivered Points</p>
            <p className="mt-3 text-4xl font-black text-emerald-300">{completedStoryPoints}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Completion Rate</p>
            <p className="mt-3 text-4xl font-black text-cyan-300">{Math.round((completedStoryPoints / Math.max(1, storyPoints)) * 100)}%</p>
          </div>
        </div>
      </div>
    </section>
  );
}
