import { FormEvent, useState } from "react";
import type { CreateTaskPayload, DescriptionDraftPayload, TaskPriority, TeamUser } from "../../types";

interface TaskComposerProps {
  users: TeamUser[];
  onCreateTask: (payload: CreateTaskPayload) => void;
  onGenerateDescription: (payload: DescriptionDraftPayload) => Promise<string>;
  canUseAi: boolean;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startDay + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const date = isCurrentMonth
      ? new Date(year, month, dayNumber)
      : dayNumber <= 0
        ? new Date(year, month - 1, daysInPreviousMonth + dayNumber)
        : new Date(year, month + 1, dayNumber - daysInMonth);

    days.push({
      key: `${date.toISOString()}-${index}`,
      date,
      isCurrentMonth,
    });
  }

  return days;
}

export function TaskComposer({ users, onCreateTask, onGenerateDescription, canUseAi }: TaskComposerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("09:00");
  const [autoGenerateSubtasks, setAutoGenerateSubtasks] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const todayValue = formatDateInputValue(new Date());
  const calendarDays = buildCalendarDays(calendarMonth);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onCreateTask({
      title,
      description,
      priority,
      storyPoints: 6,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(`${dueDate}T${dueTime}`).toISOString() : null,
      autoGenerateSubtasks,
    });

    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssigneeId("");
    setDueDate("");
    setDueTime("09:00");
    setAutoGenerateSubtasks(true);
  }

  async function handleGenerateDescription() {
    setIsGenerating(true);

    try {
      const generated = await onGenerateDescription({
        title,
        priority,
        context: description,
      });
      setDescription(generated);
    } finally {
      setIsGenerating(false);
    }
  }

  function applyDuePreset(offsetDays: number, time = "09:00") {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setDueDate(formatDateInputValue(target));
    setDueTime(time);
    setCalendarMonth(new Date(target.getFullYear(), target.getMonth(), 1));
  }

  function handlePickDate(date: Date) {
    const selectedDate = formatDateInputValue(date);
    if (selectedDate < todayValue) return;
    setDueDate(selectedDate);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  return (
    <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Create Main Task</h2>
        <p className="mt-1 text-sm leading-5 text-slate-300">
          Create a Jira-style epic or task, assign an owner, set a delivery schedule, and let AI auto-create planning subtasks.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Task title</label>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Launch the customer onboarding workflow"
            required
            value={title}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-200">Description</label>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              disabled={!canUseAi || isGenerating || !title.trim()}
              onClick={handleGenerateDescription}
              type="button"
            >
              {isGenerating ? "Generating..." : "AI Draft"}
            </button>
          </div>
          <textarea
            className="min-h-32 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Define the scope, customer value, rollout approach, and acceptance criteria."
            required
            value={description}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Priority</label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              value={priority}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Assign to</label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
              onChange={(event) => setAssigneeId(event.target.value)}
              value={assigneeId}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Schedule time</label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
              onChange={(event) => setDueTime(event.target.value)}
              value={dueTime}
            >
              <option value="09:00">09:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="14:00">02:00 PM</option>
              <option value="17:00">05:00 PM</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Due date</label>
          <div className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.94)_0%,_rgba(17,24,39,0.94)_100%)] p-4 shadow-lg shadow-slate-950/25">
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                  Delivery Schedule
                </div>

                <div className="mt-4 rounded-3xl border border-cyan-400/15 bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Date</p>
                  <p className="mt-3 text-xl font-bold text-white">
                    {dueDate ? new Date(`${dueDate}T${dueTime}`).toLocaleDateString() : "Choose a delivery day"}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {dueDate ? `Time slot: ${dueTime}` : "Pick from presets or click a date on the calendar."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                    onClick={() => setDueDate("")}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                    onClick={() => applyDuePreset(0)}
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                    onClick={() => applyDuePreset(1)}
                    type="button"
                  >
                    Tomorrow
                  </button>
                  <button
                    className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                    onClick={() => applyDuePreset(7)}
                    type="button"
                  >
                    In 1 Week
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Calendar View</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {calendarMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-white transition hover:bg-slate-800"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                      }
                      type="button"
                    >
                      {"<"}
                    </button>
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-white transition hover:bg-slate-800"
                      onClick={() =>
                        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                      }
                      type="button"
                    >
                      {">"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      {label}
                    </div>
                  ))}

                  {calendarDays.map((day) => {
                    const dateValue = formatDateInputValue(day.date);
                    const isSelected = dueDate === dateValue;
                    const isPast = dateValue < todayValue;

                    return (
                      <button
                        key={day.key}
                        className={`aspect-square rounded-2xl border text-sm font-semibold transition ${
                          isSelected
                            ? "border-teal-400 bg-teal-500 text-slate-950"
                            : isPast
                              ? "cursor-not-allowed border-slate-900 bg-slate-950/60 text-slate-700"
                              : day.isCurrentMonth
                                ? "border-slate-800 bg-slate-950 text-white hover:border-cyan-400/40 hover:bg-slate-900"
                                : "border-slate-900 bg-slate-950/60 text-slate-500 hover:border-slate-700"
                        }`}
                        disabled={isPast}
                        onClick={() => handlePickDate(day.date)}
                        type="button"
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-200">
          <input
            checked={autoGenerateSubtasks}
            className="h-4 w-4 accent-teal-500"
            onChange={(event) => setAutoGenerateSubtasks(event.target.checked)}
            type="checkbox"
          />
          Auto-generate Jira-style subtasks with AI planning and due dates
        </label>

        <button
          className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400"
          type="submit"
        >
          Create task
        </button>
      </form>
    </section>
  );
}
