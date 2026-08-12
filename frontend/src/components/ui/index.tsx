import { ReactNode } from "react";

export function StatCard({ label, value, icon, accent = "text-indigo-300" }: { label: string; value: string | number; icon?: ReactNode; accent?: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        {icon && <span className={accent}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "indigo" | "blue" }) {
  const tones: Record<string, string> = {
    slate: "bg-white/10 text-slate-300",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-rose-500/15 text-rose-300",
    indigo: "bg-indigo-500/15 text-indigo-300",
    blue: "bg-sky-500/15 text-sky-300",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const statusTone: Record<string, "slate" | "green" | "amber" | "red" | "indigo" | "blue"> = {
  draft: "slate",
  pending: "amber",
  under_review: "blue",
  correction_requested: "amber",
  approved: "green",
  rejected: "red",
  published: "indigo",
};

export function Stars({ score }: { score: number | null }) {
  if (!score) return <span className="text-xs text-slate-500">—</span>;
  const filled = "★".repeat(score);
  const empty = "☆".repeat(5 - score);
  return (
    <span className="text-sm" title={`${score}/5`}>
      <span className="text-amber-400">{filled}</span>
      <span className="text-slate-600">{empty}</span>
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass flex flex-col items-center justify-center p-10 text-center">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}