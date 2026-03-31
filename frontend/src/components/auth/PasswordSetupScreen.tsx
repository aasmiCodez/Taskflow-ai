import { FormEvent, useState } from "react";
import { PasswordCriteriaList } from "./PasswordCriteriaList";
import type { User } from "../../types";

interface PasswordSetupScreenProps {
  user?: User | null;
  onSubmit: (currentPassword: string, password: string, confirmPassword: string) => Promise<void> | void;
  title?: string;
  badgeLabel?: string;
  description?: string;
  submitLabel?: string;
  layout?: "page" | "modal";
  expectedCurrentPassword?: string | null;
}

export function PasswordSetupScreen({
  user,
  onSubmit,
  title = "Create your own password",
  badgeLabel = "Password Setup",
  description,
  submitLabel = "Save password",
  layout = "page",
  expectedCurrentPassword = null,
}: PasswordSetupScreenProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const currentPasswordValidated = expectedCurrentPassword ? currentPassword === expectedCurrentPassword : currentPassword.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onSubmit(currentPassword, password, confirmPassword);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={layout === "page" ? "mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10" : ""}>
      <section
        className={`w-full rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur xl:p-10 ${
          layout === "page" ? "" : "max-w-3xl"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">{badgeLabel}</p>
        <h1 className="mt-3 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {description ||
            `${
              user?.name ? `${user.name}, ` : ""
            }use a new password that includes at least 8 characters, one uppercase letter, one lowercase letter, and one number.`}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Current temporary password</label>
            <div className="relative">
              <input
                className={`w-full rounded-xl border bg-slate-900 px-4 py-2.5 pr-11 text-sm text-white outline-none ring-0 transition ${
                  currentPassword
                    ? currentPasswordValidated
                      ? "border-emerald-500"
                      : "border-rose-500"
                    : "border-slate-800 focus:border-teal-500"
                }`}
                onChange={(event) => setCurrentPassword(event.target.value)}
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
              />
              <button
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-lg px-2 text-slate-400 transition hover:text-slate-200"
                onClick={() => setShowCurrentPassword((current) => !current)}
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  {showCurrentPassword ? (
                    <path d="m3 3 18 18M10.6 10.7A3 3 0 0 0 13.3 13.4M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 4 10 7-0.4 1.2-1.2 2.5-2.3 3.7M6.1 6.1C3.9 7.4 2.5 9.3 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  ) : (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <p className={`mt-2 text-xs ${currentPassword ? (currentPasswordValidated ? "text-emerald-300" : "text-rose-300") : "text-slate-400"}`}>
              {currentPassword
                ? currentPasswordValidated
                  ? "Current temporary password verified."
                  : "Current temporary password does not match."
                : "Enter the temporary password that was provided to you first."}
            </p>
          </div>

          {currentPasswordValidated ? (
            <>
              <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">New password</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 pr-11 text-sm text-white outline-none ring-0 transition focus:border-teal-500"
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-lg px-2 text-slate-400 transition hover:text-slate-200"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path d="m3 3 18 18M10.6 10.7A3 3 0 0 0 13.3 13.4M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 4 10 7-0.4 1.2-1.2 2.5-2.3 3.7M6.1 6.1C3.9 7.4 2.5 9.3 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  ) : (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 pr-11 text-sm text-white outline-none ring-0 transition focus:border-teal-500"
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
              />
              <button
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-lg px-2 text-slate-400 transition hover:text-slate-200"
                onClick={() => setShowConfirmPassword((current) => !current)}
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  {showConfirmPassword ? (
                    <path d="m3 3 18 18M10.6 10.7A3 3 0 0 0 13.3 13.4M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 9 4 10 7-0.4 1.2-1.2 2.5-2.3 3.7M6.1 6.1C3.9 7.4 2.5 9.3 2 12c1 3 5 7 10 7 1.6 0 3.1-.4 4.4-1.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  ) : (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <PasswordCriteriaList password={password} />
            </>
          ) : null}

          <button
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400 disabled:opacity-60"
            disabled={isSubmitting || !currentPasswordValidated}
            type="submit"
          >
            {isSubmitting ? "Saving password..." : submitLabel}
          </button>
        </form>
      </section>
    </div>
  );
}
