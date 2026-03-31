import { FormEvent, useState } from "react";

interface LoginScreenProps {
  errorMessage?: string | null;
  infoMessage?: string | null;
  onLogin: (credentials: { email: string; password: string }) => Promise<void> | void;
  onForgotPassword: (email: string) => Promise<void> | void;
}

export function LoginScreen({ errorMessage, infoMessage, onLogin, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submitLogin() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onLogin({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitLogin();
  }

  async function handleForgotPassword() {
    if (isRequestingReset || !email.trim()) return;
    setIsRequestingReset(true);

    try {
      await onForgotPassword(email);
    } finally {
      setIsRequestingReset(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-6 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[32px] border border-slate-800 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur xl:p-12">
        <div className="inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
          TaskFlow AI CRM
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white xl:text-6xl">
          Jira-style task delivery, AI planning, and CRM workflows in one place.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Plan major work items, auto-generate subtasks with story points, move cards through review, and track delivery with charts.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "AI subtasks with story points",
            "Drag-and-drop workflow board",
            "PDF and Excel-friendly exports",
          ].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm font-medium text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur xl:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">Workspace Access</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Login to dashboard</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Sign in with your workspace credentials to access the dashboard.
        </p>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {infoMessage ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {infoMessage}
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-teal-500"
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 pr-11 text-sm text-white outline-none ring-0 transition focus:border-teal-500"
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-lg px-2 text-slate-400 transition hover:text-slate-200"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path d="m3 3 18 18M10.6 10.7A3 3 0 0 0 13.3 13.4M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 4 10 7-0.4 1.2-1.2 2.5-2.3 3.7M6.1 6.1C3.9 7.4 2.5 9.3 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              className="inline-flex min-w-[190px] cursor-pointer items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={submitLogin}
              type="button"
            >
              {isSubmitting ? "Opening workspace..." : "Login to dashboard"}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm font-semibold text-white">Forgot your password?</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Enter your workspace email above, then request a secure reset link. For privacy, we always return the same
            response whether or not the account exists.
          </p>
          <button
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={isRequestingReset || !email.trim()}
            onClick={handleForgotPassword}
            type="button"
          >
            {isRequestingReset ? "Sending reset link..." : "Send reset link"}
          </button>
        </div>
      </section>
    </div>
  );
}
