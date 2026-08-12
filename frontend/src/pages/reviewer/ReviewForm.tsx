import { useState } from "react";
import { Check, X, Edit3 } from "lucide-react";
import { ReviewDecision, TranslationPair } from "@/types";

interface Props {
  pair: TranslationPair;
  submitting: boolean;
  onSubmit: (decision: ReviewDecision, payload: { comment?: string; correctedSource?: string; correctedTarget?: string; qualityScore?: number }) => void;
  onCancel: () => void;
}

export default function ReviewForm({ pair, submitting, onSubmit, onCancel }: Props) {
  const [comment, setComment] = useState("");
  const [correctedSource, setCorrectedSource] = useState(pair.source_text);
  const [correctedTarget, setCorrectedTarget] = useState(pair.target_text);
  const [qualityScore, setQualityScore] = useState(4);
  const [mode, setMode] = useState<"view" | "correct">("view");

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Translation Review</h2>
        <button className="btn-secondary" onClick={() => setMode(mode === "view" ? "correct" : "view")}>
          <Edit3 size={15} /> {mode === "view" ? "Correct" : "View Original"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="label">{pair.source_language.toUpperCase()}</p>
          {mode === "correct" ? (
            <textarea className="input min-h-[90px] resize-y" value={correctedSource} onChange={(e) => setCorrectedSource(e.target.value)} />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">{pair.source_text}</div>
          )}
        </div>

        <div>
          <p className="label">{pair.target_language.toUpperCase()}</p>
          {mode === "correct" ? (
            <textarea className="input min-h-[90px] resize-y" value={correctedTarget} onChange={(e) => setCorrectedTarget(e.target.value)} />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">{pair.target_text}</div>
          )}
        </div>

        <div>
          <p className="label">Quality</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setQualityScore(n)}
                className={`h-10 w-10 rounded-lg text-lg transition-colors ${
                  qualityScore >= n ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-600 hover:text-slate-400"
                }`}
                title={`${n} star${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 self-center text-xs text-slate-400">
              {qualityScore === 5 ? "Excellent" : qualityScore === 4 ? "Good" : qualityScore === 3 ? "Acceptable" : qualityScore === 2 ? "Needs correction" : "Incorrect"}
            </span>
          </div>
        </div>

        <div>
          <p className="label">Reviewer Note</p>
          <textarea className="input min-h-[70px] resize-y" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional note for the contributor..." />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="btn-danger"
          disabled={submitting}
          onClick={() => onSubmit("reject", { comment })}
        >
          <X size={16} /> Reject
        </button>
        <button
          className="btn-secondary"
          disabled={submitting}
          onClick={() => onSubmit("request_correction", { comment, correctedSource, correctedTarget })}
        >
          <Edit3 size={16} /> Request Correction
        </button>
        <button
          className="btn-success"
          disabled={submitting}
          onClick={() => onSubmit("approve", { comment, qualityScore, correctedSource, correctedTarget })}
        >
          <Check size={16} /> Approve
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}