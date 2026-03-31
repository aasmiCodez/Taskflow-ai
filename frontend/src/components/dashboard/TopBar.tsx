import type { User } from "../../types";

interface TopBarProps {
  user: User;
  title: string;
  description: string;
  canOpenHierarchy: boolean;
  onOpenHierarchy: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

function HierarchyIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v4m0 0H7m5 0h5M7 9v4m10-4v4M7 13h10M5 19h4v-3H5v3Zm5 0h4v-3h-4v3Zm5 0h4v-3h-4v3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function TopBar({ user, title, description, canOpenHierarchy, onOpenHierarchy, onOpenSettings, onLogout }: TopBarProps) {
  return (
    <header className="rounded-[28px] border border-slate-800 bg-slate-950/90 px-5 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Operations Command</p>
          <h2 className="mt-2 text-3xl font-black text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
            {user.role}
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100">
            {user.name}
          </span>
          {canOpenHierarchy ? (
            <button
              aria-label="Open workspace hierarchy"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-white transition hover:bg-slate-800"
              onClick={onOpenHierarchy}
              title="Hierarchy view"
              type="button"
            >
              <HierarchyIcon />
            </button>
          ) : null}
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={onOpenSettings}
            type="button"
          >
            Settings
          </button>
          <button className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
