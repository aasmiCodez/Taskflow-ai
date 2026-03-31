import { FormEvent, useEffect, useState } from "react";
import type { User } from "../../types";

export type ThemeChoice = "aurora" | "sunset" | "forest";

interface SettingsModalProps {
  user: User;
  theme: ThemeChoice;
  onClose: () => void;
  onSave: (payload: { name: string; password?: string; theme: ThemeChoice }) => Promise<void>;
}

const themeOptions: Array<{ value: ThemeChoice; label: string; preview: string }> = [
  {
    value: "aurora",
    label: "Aurora",
    preview: "bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#0b1120_100%)]",
  },
  {
    value: "sunset",
    label: "Sunset",
    preview: "bg-[linear-gradient(135deg,_#1f2937_0%,_#4c1d95_45%,_#7c2d12_100%)]",
  },
  {
    value: "forest",
    label: "Forest",
    preview: "bg-[linear-gradient(135deg,_#052e16_0%,_#14532d_45%,_#1f2937_100%)]",
  },
];

export function SettingsModal({ user, theme, onClose, onSave }: SettingsModalProps) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeChoice>(theme);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        ...(password.trim() ? { password } : {}),
        theme: selectedTheme,
      });
      setPassword("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <button aria-label="Close settings" className="absolute inset-0" onClick={onClose} type="button" />

      <section className="relative z-10 w-full max-w-2xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98)_0%,_rgba(2,6,23,0.98)_100%)] p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Settings</p>
            <h2 className="mt-2 text-3xl font-black text-white">Profile & Preferences</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Update your display name, optionally change your password, and pick the workspace theme you like most.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Name</label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-400 outline-none"
                disabled
                value={user.email}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Role</label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-400 outline-none"
                disabled
                value={user.role}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">New Password</label>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank to keep current password"
                type="password"
                value={password}
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-200">Theme</label>
            <div className="grid gap-3 md:grid-cols-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`rounded-3xl border p-3 text-left transition ${
                    selectedTheme === option.value
                      ? "border-teal-400 bg-teal-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                  }`}
                  onClick={() => setSelectedTheme(option.value)}
                  type="button"
                >
                  <div className={`h-20 rounded-2xl ${option.preview}`} />
                  <p className="mt-3 text-sm font-semibold text-white">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
