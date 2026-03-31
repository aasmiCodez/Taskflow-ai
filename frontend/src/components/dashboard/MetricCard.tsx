interface MetricCardProps {
  label: string;
  value: number;
  tone?: "brand" | "amber" | "rose" | "emerald";
}

const toneMap: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  brand: "border-cyan-500/20 bg-cyan-500/10 text-cyan-100",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-100",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
};

export function MetricCard({ label, value, tone = "brand" }: MetricCardProps) {
  return (
    <article className={`rounded-3xl border p-5 ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </article>
  );
}
