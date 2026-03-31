import type { User } from "../../types";

interface TopBarProps {
  user: User;
  title: string;
  description: string;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function TopBar({ user, title, description, onOpenSettings, onLogout }: TopBarProps) {
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
