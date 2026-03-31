type ModuleId = "overview" | "users" | "tasks" | "schedule" | "assignments" | "reports";

interface SidebarNavProps {
  activeModule: ModuleId;
  onSelect: (moduleId: ModuleId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function OverviewIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M4 19h16M6 16l3-4 3 2 5-7 1 9H6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M4 5h5v14H4V5Zm11 0h5v8h-5V5Zm-5 6h5v8h-5v-8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function AssignmentIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M8 7h10M8 12h10M8 17h6M5 7h.01M5 12h.01M5 17h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Zm3 7h3v3H8v-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M7 4h10v16H7V4Zm3 4v8m4-5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

const modules: Array<{ id: ModuleId; label: string; description: string; icon: () => JSX.Element }> = [
  { id: "overview", label: "Overview", description: "Charts and delivery pulse", icon: OverviewIcon },
  { id: "users", label: "User CRM", description: "Create users and manage access", icon: UsersIcon },
  { id: "tasks", label: "Taskdrome", description: "Move cards like Jira", icon: BoardIcon },
  { id: "schedule", label: "Schedule Hub", description: "See all due dates in one view", icon: ScheduleIcon },
  { id: "assignments", label: "Assignments", description: "Plan work and AI subtasks", icon: AssignmentIcon },
  { id: "reports", label: "Reports", description: "PDF and Excel exports", icon: ReportsIcon },
];

export function SidebarNav({ activeModule, onSelect, collapsed, onToggle }: SidebarNavProps) {
  return (
    <aside
      className={`h-fit max-h-full overflow-y-auto rounded-[30px] border border-slate-800 bg-slate-950/90 p-4 transition-all duration-200 ${
        collapsed ? "w-[88px]" : "w-full"
      }`}
    >
      <div className={`mb-6 flex ${collapsed ? "justify-center" : "items-start justify-between gap-3"}`}>
        <div className={collapsed ? "hidden" : "block"}>
          <div className="inline-flex rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-200">
            CRM Suite
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white">TaskFlow AI</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Users, planning, charts, exports, and Jira-style workflow in one operational shell.
          </p>
        </div>

        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-lg font-semibold text-slate-100 transition hover:bg-slate-800"
          onClick={onToggle}
          type="button"
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <nav className="space-y-2">
        {modules.map((module) => {
          const active = module.id === activeModule;
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              className={`flex w-full ${collapsed ? "justify-center" : "items-start gap-3"} rounded-xl border px-3.5 py-2.5 text-left transition ${
                active
                  ? "border-teal-500/20 bg-teal-500/10 text-white"
                  : "border-transparent bg-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900/80"
              }`}
              onClick={() => onSelect(module.id)}
              title={collapsed ? module.label : undefined}
              type="button"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-teal-100">
                <Icon />
              </span>
              {!collapsed ? (
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{module.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{module.description}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
