import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { translationService, reviewService } from "@/services";
import { Badge, EmptyState, Stars, statusTone } from "@/components/ui";
import { TranslationPair } from "@/types";

export default function MyContributions() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-contributions", status],
    queryFn: () => translationService.list({ status }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => translationService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-contributions"] }),
  });

  const histories = useQuery({
    queryKey: ["review-history"],
    queryFn: async () => {
      const pairs = data?.data ?? [];
      const results = await Promise.all(
        pairs.filter((p) => p.review_count > 0).map((p) => reviewService.history(p.id).then((r) => ({ id: p.id, reviews: r.data })))
      );
      return results;
    },
    enabled: Boolean(data?.data?.length),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Contributions</h1>
          <p className="text-sm text-slate-400">View your submitted translation pairs and their status.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { value: "", label: "All" },
          { value: "draft", label: "Draft" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "correction_requested", label: "Correction" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              status === s.value ? "bg-indigo-500/20 text-indigo-200" : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="glass p-10 text-center text-sm text-slate-400">Loading...</div>
      ) : !data?.data?.length ? (
        <EmptyState message="No contributions yet. Add your first translation pair." />
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.data.map((t: TranslationPair) => (
                <tr key={t.id} className="hover:bg-white/[0.03]">
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-slate-200">{t.source_text}</p>
                    <p className="text-[10px] uppercase text-slate-500">
                      {t.source_language} → {t.target_language}
                    </p>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-slate-300">{t.target_text}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.domain}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[t.status] ?? "slate"}>{t.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Stars score={t.quality_score} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-slate-500 hover:text-rose-400"
                      title="Delete"
                      onClick={() => {
                        if (confirm("Delete this contribution?")) deleteMutation.mutate(t.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {histories.data && histories.data.some((h) => h.reviews.length) && (
        <div className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">Reviewer Notes</h2>
          <div className="space-y-3">
            {histories.data.flatMap((h) =>
              h.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <p className="text-xs text-slate-500">
                    {r.profiles?.full_name ?? "Reviewer"} ·{" "}
                    <span className="capitalize text-slate-400">{r.decision.replace(/_/g, " ")}</span>
                    {r.quality_score ? ` · ${r.quality_score}/5` : ""}
                  </p>
                  {r.comment && <p className="mt-1 text-slate-300">{r.comment}</p>}
                  {r.corrected_source && (
                    <p className="mt-1 text-xs text-emerald-300">Corrected source: {r.corrected_source}</p>
                  )}
                  {r.corrected_target && (
                    <p className="mt-1 text-xs text-emerald-300">Corrected target: {r.corrected_target}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}