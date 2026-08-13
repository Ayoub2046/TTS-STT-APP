import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Type, ShieldCheck, CheckCircle2, XCircle, Star, Clock, ClipboardList, FileText } from "lucide-react";
import { adminService, datasetService } from "@/services";
import { StatCard } from "@/components/ui";

export default function AdminDashboard() {
  const { data: admin, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminService.stats() });
  const { data: ds } = useQuery({ queryKey: ["dataset-stats"], queryFn: () => datasetService.stats({}) });

  const a = admin?.data;
  const d = ds?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-slate-400">Platform overview: users, translations, and dataset quality.</p>
      </div>

      {isLoading ? (
        <div className="glass p-10 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="card-grid">
            <StatCard label="Total Users" value={a?.totalUsers ?? 0} icon={<Users size={18} />} accent="text-sky-300" />
            <StatCard label="Contributors" value={a?.contributors ?? 0} icon={<Users size={18} />} accent="text-indigo-300" />
            <StatCard label="Total Sentences" value={a?.totalSentences ?? 0} icon={<Type size={18} />} accent="text-emerald-300" />
            <StatCard label="Reviews Done" value={a?.totalReviews ?? 0} icon={<ClipboardList size={18} />} accent="text-amber-300" />
          </div>

          <div className="card-grid">
            <StatCard label="Approved" value={a?.approved ?? 0} icon={<CheckCircle2 size={18} />} accent="text-emerald-300" />
            <StatCard label="Pending Review" value={a?.pending ?? 0} icon={<Clock size={18} />} accent="text-amber-300" />
            <StatCard label="Rejected" value={a?.rejected ?? 0} icon={<XCircle size={18} />} accent="text-rose-300" />
            <StatCard label="Quality ≥ 4" value={a?.qualityGte4 ?? 0} icon={<Star size={18} />} accent="text-yellow-300" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass p-6">
              <h2 className="mb-4 text-sm font-semibold text-slate-300">Dataset Directions</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <span>Maay → Maxaa</span>
                  <span className="font-mono text-slate-300">{d?.maayToMaxaa ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <span>Maxaa → Maay</span>
                  <span className="font-mono text-slate-300">{d?.maxaaToMaay ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <span>Quality ≥ threshold (%)</span>
                  <span className="font-mono text-emerald-300">{d?.qualityOkPercent ?? 0}%</span>
                </div>
              </div>
            </div>

            <div className="glass p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <ShieldCheck size={16} className="text-indigo-300" />
                Domain Distribution
              </h2>
              {d?.domains && Object.keys(d.domains).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(d.domains)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([domain, count]) => (
                      <div key={domain}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-400">{domain.replace(/_/g, " ")}</span>
                          <span className="font-mono">{count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-indigo-400"
                            style={{ width: `${d.total ? (count / d.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No data yet.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/admin/submissions" className="glass glass-hover flex items-center justify-between p-5 hover:bg-white/[0.06]">
              <div>
                <p className="text-sm font-medium">All Submissions</p>
                <p className="text-xs text-slate-500">View all user translation pairs</p>
              </div>
              <FileText size={18} className="text-indigo-400" />
            </Link>
            <Link to="/admin/users" className="glass glass-hover flex items-center justify-between p-5 hover:bg-white/[0.06]">
              <div>
                <p className="text-sm font-medium">User Management</p>
                <p className="text-xs text-slate-500">Roles, activation, activity</p>
              </div>
              <Users size={18} className="text-slate-500" />
            </Link>
            <Link to="/reviewer/queue" className="glass glass-hover flex items-center justify-between p-5 hover:bg-white/[0.06]">
              <div>
                <p className="text-sm font-medium">Review Queue</p>
                <p className="text-xs text-slate-500">Approve, correct, reject</p>
              </div>
              <ShieldCheck size={18} className="text-slate-500" />
            </Link>
            <Link to="/admin/huggingface" className="glass glass-hover flex items-center justify-between p-5 hover:bg-white/[0.06]">
              <div>
                <p className="text-sm font-medium">Hugging Face</p>
                <p className="text-xs text-slate-500">Publish the dataset</p>
              </div>
              <Star size={18} className="text-slate-500" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}