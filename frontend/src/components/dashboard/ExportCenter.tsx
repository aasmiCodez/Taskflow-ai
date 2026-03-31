import type { Task } from "../../types";
import { getTaskStoryPoints } from "../../lib/storyPoints";

interface ExportCenterProps {
  tasks: Task[];
  onExportCsv: () => void;
  onExportPdf: () => void;
}

function formatStatus(task: Task) {
  return task.status.replace("_", " ");
}

export function ExportCenter({ tasks, onExportCsv, onExportPdf }: ExportCenterProps) {
  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports & Exports</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Export the current workflow to CSV for Excel or open a clean print view for PDF generation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={onExportCsv} type="button">
            Export Excel CSV
          </button>
          <button className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400" onClick={onExportPdf} type="button">
            Open PDF View
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              <th className="pb-3 font-semibold text-white">Task</th>
              <th className="pb-3 font-semibold text-white">Owner</th>
              <th className="pb-3 font-semibold text-white">Points</th>
              <th className="pb-3 font-semibold text-white">Priority</th>
              <th className="pb-3 font-semibold text-white">Status</th>
              <th className="pb-3 font-semibold text-white">Subtasks</th>
              <th className="pb-3 font-semibold text-white">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-800 last:border-b-0">
                <td className="py-3 text-white">{task.title}</td>
                <td className="py-3 text-slate-300">{task.assignee?.name || "Unassigned"}</td>
                <td className="py-3 text-slate-300">{getTaskStoryPoints(task)}</td>
                <td className="py-3 text-slate-300">{task.priority}</td>
                <td className="py-3 text-slate-300">{formatStatus(task)}</td>
                <td className="py-3 text-slate-300">{task.subtasks.length}</td>
                <td className="py-3 text-slate-300">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
