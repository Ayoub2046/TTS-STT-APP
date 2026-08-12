import { useQuery } from "@tanstack/react-query";
import { Send, CheckCircle2, Clock, XCircle, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";
import { translationService } from "@/services";
import { StatCard } from "@/components/ui";
import { useAuthStore } from "@/store/auth";

export default function ContributorDashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => translationService.myStats(),
  });

  const s = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user?.full_name?.split(" ")[0] ?? "Sahib"} 👋</h1>
          <p className="text-sm text-slate-400">Track your contributions to the Maay ↔ Maxaa corpus.</p>
        </div>
        <Link to="/contributor/submit" className="btn-primary">
          <Send size={16} /> Add Translation
        </Link>
      </div>

      {isLoading ? (
        <div className="glass p-10 text-center text-sm text-slate-400">Loading stats...</div>
      ) : (
        <>
          <div className="card-grid">
            <StatCard label="Submitted" value={s?.submitted ?? 0} icon={<Send size={18} />} accent="text-sky-300" />
            <StatCard label="Approved" value={s?.approved ?? 0} icon={<CheckCircle2 size={18} />} accent="text-emerald-300" />
            <StatCard label="Pending" value={s?.pending ?? 0} icon={<Clock size={18} />} accent="text-amber-300" />
            <StatCard label="Rejected" value={s?.rejected ?? 0} icon={<XCircle size={18} />} accent="text-rose-300" />
          </div>

          <div className="card-grid">
            <StatCard label="Corrections Requested" value={s?.correctionRequested ?? 0} icon={<ArrowLeftRight size={18} />} accent="text-indigo-300" />
            <StatCard label="Approval Rate" value={`${s?.approvalRate ?? 0}%`} icon={<CheckCircle2 size={18} />} accent="text-emerald-300" />
          </div>

          <div className="glass p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-300">Getting Started</h2>
            <ol className="space-y-2 text-sm text-slate-400">
              <li>1. Add a Maay sentence and its Maxaa translation.</li>
              <li>2. A reviewer will validate your contribution.</li>
              <li>3. Approved pairs are compiled into the dataset and published to Hugging Face.</li>
              <li>4. Help us cover domains: education, health, agriculture, technology, culture, religion, and more.</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}