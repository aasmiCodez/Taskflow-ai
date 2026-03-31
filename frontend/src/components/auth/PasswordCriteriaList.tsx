interface PasswordCriteriaListProps {
  password: string;
}

function CriteriaItem({ label, matched }: { label: string; matched: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
        matched
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-slate-800 bg-slate-900/70 text-slate-400"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
          matched ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100" : "border-slate-700 text-slate-500"
        }`}
      >
        {matched ? "✓" : "•"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function PasswordCriteriaList({ password }: PasswordCriteriaListProps) {
  const checks = [
    { label: "At least 8 characters", matched: password.length >= 8 },
    { label: "At least one uppercase letter", matched: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", matched: /[a-z]/.test(password) },
    { label: "At least one number", matched: /\d/.test(password) },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Password rules</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {checks.map((check) => (
          <CriteriaItem key={check.label} label={check.label} matched={check.matched} />
        ))}
      </div>
    </div>
  );
}
