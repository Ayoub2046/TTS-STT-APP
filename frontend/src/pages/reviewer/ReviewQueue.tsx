import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3 } from "lucide-react";
import { reviewService } from "@/services";
import { Badge, EmptyState, statusTone } from "@/components/ui";
import { ReviewDecision, TranslationPair } from "@/types";
import { ApiError } from "@/services/api";
import ReviewForm from "./ReviewForm";

export default function ReviewQueue() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TranslationPair | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => reviewService.pending({}),
  });

  const countByStatus = (pairs: TranslationPair[] | undefined) => ({
    pending: pairs?.filter((p) => p.status === "pending").length ?? 0,
    correction: pairs?.filter((p) => p.status === "correction_requested").length ?? 0,
  });

  const counts = countByStatus(data?.data);

  const completeMutation = useMutation({
    mutationFn: (v: { id: string; decision: ReviewDecision; data: { comment?: string; correctedSource?: string; correctedTarget?: string; qualityScore?: number } }) =>
      reviewService.submit(v.id, { decision: v.decision, ...v.data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      setSelected(null);
    },
    onError: (err) => alert(err instanceof ApiError ? err.message : "Review failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Review Queue</h1>
          <p className="text-sm text-slate-400">
            {counts.pending} pending · {counts.correction} correction requested
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {isLoading ? (
            <div className="glass p-10 text-center text-sm text-slate-400">Loading...</div>
          ) : !data?.data?.length ? (
            <EmptyState message="Queue is clear. Nice work!" />
          ) : (
            <div className="space-y-3">
              {data.data.map((t: TranslationPair) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`glass glass-hover w-full p-4 text-left transition-colors ${
                    selected?.id === t.id ? "border-indigo-400/60" : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Badge tone={statusTone[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-slate-500">
                      {t.source_language} → {t.target_language} · {t.domain}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200">{t.source_text}</p>
                  <p className="mt-1 text-sm text-slate-400">{t.target_text}</p>
                  <p className="mt-2 text-xs text-slate-500">by {t.profiles?.full_name ?? "contributor"}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          {selected ? (
            <ReviewForm
              pair={selected}
              submitting={completeMutation.isPending}
              onSubmit={(decision, payload) => completeMutation.mutate({ id: selected.id, decision, data: payload })}
              onCancel={() => setSelected(null)}
            />
          ) : (
            <div className="glass flex flex-col items-center justify-center gap-2 p-10 text-center">
              <Edit3 size={22} className="text-slate-500" />
              <p className="text-sm text-slate-400">Select a translation to review. Compare both directions side by side, then approve, request correction, or reject with a quality score.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}