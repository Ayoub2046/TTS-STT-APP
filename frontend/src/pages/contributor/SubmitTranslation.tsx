import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DOMAINS } from "@/types";
import { translationService } from "@/services";
import { ApiError } from "@/services/api";
import { submitWithOfflineFallback } from "@/lib/offlineQueue";

interface ValidationIssue {
  type: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export default function SubmitTranslation() {
  const navigate = useNavigate();
  const [direction, setDirection] = useState<"maay-to-maxaa" | "maxaa-to-maay">("maay-to-maxaa");
  const [domain, setDomain] = useState("general");
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sourceLang = direction.startsWith("maay") ? "maay" : "maxaa";
  const targetLang = direction.startsWith("maay") ? "maxaa" : "maay";

  const clientValidation = (src: string, tgt: string): ValidationIssue[] => {
    const out: ValidationIssue[] = [];
    const cleanSrc = src.replace(/\s+/g, " ").trim();
    const cleanTgt = tgt.replace(/\s+/g, " ").trim();
    if (!cleanSrc) out.push({ type: "empty_source", message: "Source text cannot be empty.", field: "sourceText", severity: "error" });
    if (!cleanTgt) out.push({ type: "empty_target", message: "Target text cannot be empty.", field: "targetText", severity: "error" });
    if (cleanSrc && cleanSrc.length < 2) out.push({ type: "too_short", message: "Source text is too short.", field: "sourceText", severity: "error" });
    if (cleanTgt && cleanTgt.length < 2) out.push({ type: "too_short", message: "Target text is too short.", field: "targetText", severity: "error" });
    if (cleanSrc && cleanTgt && cleanSrc.toLowerCase() === cleanTgt.toLowerCase()) {
      out.push({ type: "untranslated", message: "Possible untranslated sentence: source and target look identical.", severity: "warning" });
    }
    return out;
  };

  const updateSource = (v: string) => {
    setSourceText(v);
    setIssues(clientValidation(v, targetText));
  };
  const updateTarget = (v: string) => {
    setTargetText(v);
    setIssues(clientValidation(sourceText, v));
  };

  const submit = async (status: "pending" | "draft") => {
    setLoading(true);
    setError(null);
    const validation = clientValidation(sourceText, targetText);
    setIssues(validation);
    if (status === "pending" && validation.some((i) => i.severity === "error")) {
      setError("Fix the issues below before submitting.");
      setLoading(false);
      return;
    }
    try {
      if (status === "pending") {
        const result = await submitWithOfflineFallback({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          sourceText,
          targetText,
          domain,
        });
        alert(
          result.offline
            ? "You are offline. Your translation was saved locally and will sync when you reconnect."
            : "Translation submitted successfully."
        );
        if (!result.offline) navigate("/contributor/contributions");
      } else {
        const res = await translationService.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          sourceText,
          targetText,
          domain,
          status,
        });
        if (res.data.validation.issues.length > 0) {
          setIssues(res.data.validation.issues as ValidationIssue[]);
        }
        alert("Draft saved.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save translation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Translation Pair</h1>
        <p className="text-sm text-slate-400">Add a Maay sentence and its Maxaa translation (or the reverse).</p>
      </div>

      <div className="glass p-6">
        <div className="mb-6 space-y-6">
          <div>
            <p className="label">Direction</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDirection("maay-to-maxaa")}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  direction === "maay-to-maxaa"
                    ? "border-indigo-400 bg-indigo-500/15 text-indigo-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                🇸🇴 Maay → Maxaa
              </button>
              <button
                onClick={() => setDirection("maxaa-to-maay")}
                className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                  direction === "maxaa-to-maay"
                    ? "border-indigo-400 bg-indigo-500/15 text-indigo-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Maxaa → Maay 🇸🇴
              </button>
            </div>
          </div>

          <div>
            <label className="label">Domain</label>
            <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)}>
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{sourceLang === "maay" ? "Maay" : "Maxaa"}</label>
            <textarea
              className="input min-h-[110px] resize-y"
              value={sourceText}
              onChange={(e) => updateSource(e.target.value)}
              placeholder={sourceLang === "maay" ? "Type Maay sentence..." : "Type Maxaa sentence..."}
            />
          </div>

          <div>
            <label className="label">{targetLang === "maxaa" ? "Maxaa" : "Maay"}</label>
            <textarea
              className="input min-h-[110px] resize-y"
              value={targetText}
              onChange={(e) => updateTarget(e.target.value)}
              placeholder={targetLang === "maxaa" ? "Type Maxaa translation..." : "Type Maay translation..."}
            />
          </div>
        </div>

        {issues.length > 0 && (
          <div className="mb-4 space-y-2">
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  issue.severity === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {issue.severity === "error" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
                {issue.message}
              </div>
            ))}
          </div>
        )}

        {error && <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

        <div className="flex gap-3">
          <button className="btn-secondary" disabled={loading} onClick={() => submit("draft")}>
            <Save size={16} /> Save Draft
          </button>
          <button className="btn-primary" disabled={loading} onClick={() => submit("pending")}>
            <Send size={16} /> {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}