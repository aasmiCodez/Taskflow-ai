import { FormEvent, useState } from "react";
import type { AiSearchResult } from "../../types";
import { TaskDetailSheet } from "./TaskDetailSheet";

interface AiSearchPanelProps {
  summary: string;
  results: AiSearchResult[];
  onSearch: (query: string) => void;
}

export function AiSearchPanel({ summary, results, onSearch }: AiSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = results.find((result) => result.task.id === selectedTaskId)?.task ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query);
  }

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">AI Search</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Search by task title, assignee, milestone language, or delivery terms and jump to the most relevant work.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-teal-500"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for sprint handoff, review blockers, urgent bugs..."
          value={query}
        />
        <div className="flex justify-start">
          <button className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400" type="submit">
            Search tasks
          </button>
        </div>
      </form>

      {summary ? <p className="mt-5 text-sm leading-6 text-slate-300">{summary}</p> : null}

      <div className="mt-5 space-y-3">
        {results.map((result) => (
          <button
            key={result.task.id}
            className="group block w-full rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.92)_0%,_rgba(30,41,59,0.82)_100%)] p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-950/20"
            onClick={() => setSelectedTaskId(result.task.id)}
            type="button"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Main Task
                  </span>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    Score {result.score}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white transition group-hover:text-cyan-100">{result.task.title}</h3>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition group-hover:text-cyan-100">
                Open Detail View
              </span>
            </div>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{result.task.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                {result.task.status.replace("_", " ")}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                {result.task.priority}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                {result.task.subtasks.length} Subtasks
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                {result.task.assignee?.name || "Unassigned"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedTask ? <TaskDetailSheet onClose={() => setSelectedTaskId(null)} task={selectedTask} /> : null}
    </section>
  );
}
