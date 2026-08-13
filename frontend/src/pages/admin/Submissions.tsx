import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Search, Filter, CheckCircle2 } from "lucide-react";
import { translationService, reviewService } from "@/services";
import { Badge, EmptyState, Stars, statusTone } from "@/components/ui";
import { TranslationPair, DOMAINS } from "@/types";

import { ApiError } from "@/services/api";

export default function AllSubmissions() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [domain, setDomain] = useState("");
  const [direction, setDirection] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["all-submissions", status, domain, direction, search],
    queryFn: () => translationService.list({ status, domain, direction, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => translationService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-submissions"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Delete failed"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewService.submit(id, { decision: "approve", qualityScore: 5 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-submissions"] }),
    onError: (err) => alert(err instanceof ApiError ? err.message : "Approve failed"),
  });

  const pairs = data?.data ?? [];
  const totalCount = data?.meta?.total ?? pairs.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">All User Submissions</h1>
          <p className="text-sm text-slate-400">
            Browse, inspect, and filter all community-submitted Maay ↔ Maxaa translation pairs ({totalCount} total).
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass space-y-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "correction_requested", label: "Correction Req." },
              { value: "draft", label: "Draft" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === s.value
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-transparent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-9 text-xs"
              placeholder="Search sentence or contributor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter size={14} />
            <span>Refine:</span>
          </div>

          {/* Direction Filter */}
          <select
            className="input py-1 text-xs max-w-[180px]"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="">All Directions</option>
            <option value="maay-to-maxaa">Maay → Maxaa</option>
            <option value="maxaa-to-maay">Maxaa → Maay</option>
          </select>

          {/* Domain Filter */}
          <select
            className="input py-1 text-xs max-w-[180px]"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            <option value="">All Domains</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {(status || domain || direction || search) && (
            <button
              onClick={() => {
                setStatus("");
                setDomain("");
                setDirection("");
                setSearch("");
              }}
              className="text-indigo-400 hover:underline text-xs ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      {isLoading ? (
        <div className="glass p-10 text-center text-sm text-slate-400">Loading translations...</div>
      ) : !pairs.length ? (
        <EmptyState message="No translations match your filter criteria." />
      ) : (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                  <th className="px-4 py-3">Contributor</th>
                  <th className="px-4 py-3">Source Dialect</th>
                  <th className="px-4 py-3">Target Dialect</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quality</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pairs.map((t: TranslationPair) => (
                  <tr key={t.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                          {(t.profiles?.full_name ?? "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 text-xs">{t.profiles?.full_name ?? "Community Contributor"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="text-slate-200 text-xs line-clamp-2">{t.source_text}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {t.source_language}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="text-slate-300 text-xs line-clamp-2">{t.target_text}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300">
                        {t.target_language}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 capitalize">
                      {t.domain.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[t.status] ?? "slate"}>{t.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Stars score={t.quality_score} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {["pending", "correction_requested", "draft"].includes(t.status) && (
                          <button
                            className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                            title="Quick Approve"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(t.id)}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          title="Delete record"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this translation entry?")) {
                              deleteMutation.mutate(t.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
