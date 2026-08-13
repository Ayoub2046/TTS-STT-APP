import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Rocket, RefreshCw, CloudUpload, History, ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import { huggingfaceService } from "@/services";
import { ApiError } from "@/services/api";

export default function AdminHuggingFace() {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState("1.0.0");
  const [commitMessage, setCommitMessage] = useState("Release Maay-Maxaa dataset");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["hf-status"],
    queryFn: () => huggingfaceService.status(),
  });

  const { data: preview, refetch: generatePreview, isFetching: previewing } = useQuery({
    queryKey: ["hf-preview"],
    queryFn: () => huggingfaceService.preview(),
    enabled: false,
  });

  const { data: history } = useQuery({ queryKey: ["hf-history"], queryFn: () => huggingfaceService.history() });

  const pushMutation = useMutation({
    mutationFn: () =>
      huggingfaceService.push({ datasetId: "00000000-0000-0000-0000-000000000000", version, commitMessage }),
    onSuccess: (res) => {
      setResult(res.data.message);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["hf-status"] });
      queryClient.invalidateQueries({ queryKey: ["hf-history"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Push failed");
      setResult(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => huggingfaceService.delete(),
    onSuccess: (res) => {
      setResult(res.data.message);
      setError(null);
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["hf-status"] });
      queryClient.invalidateQueries({ queryKey: ["hf-history"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Delete failed");
      setResult(null);
      setShowDeleteConfirm(false);
    },
  });

  const s = status?.data;
  const canPush = Boolean(s?.readyToPush);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hugging Face Publishing</h1>
        <p className="text-sm text-slate-400">Generate, validate, preview, push, or delete dataset repositories on HF Hub.</p>
      </div>

      {isLoading ? (
        <div className="glass p-10 text-center text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Rocket size={16} className="text-indigo-300" /> Push Configuration
            </h2>

            <div className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Repository</span>
                {s?.repoId ? (
                  <a
                    href={`https://huggingface.co/datasets/${s.repoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-indigo-300 hover:text-indigo-200 hover:underline flex items-center gap-1.5 text-xs"
                  >
                    {s.repoId} <ExternalLink size={13} />
                  </a>
                ) : (
                  <span className="font-mono text-slate-200">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HF_Token configured</span>
                <span className={s?.configured ? "text-emerald-300" : "text-rose-300"}>
                  {s?.configured ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved records</span>
                <span className="font-mono text-slate-200">{s?.approvedRecords ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quality ≥ 4</span>
                <span className="font-mono text-slate-200">{s?.qualityGte4 ?? 0}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Version (semver)</label>
                <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
              </div>
              <div>
                <label className="label">Commit Message</label>
                <input className="input" value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} />
              </div>
            </div>

            {error && <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
            {result && <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{result}</p>}

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-secondary" disabled={previewing} onClick={() => generatePreview()}>
                <RefreshCw size={16} className={previewing ? "animate-spin" : ""} /> Generate Preview
              </button>
              <button
                className="btn-primary"
                disabled={!canPush || pushMutation.isPending}
                onClick={() => pushMutation.mutate()}
                title={!canPush ? "No approved records to publish" : ""}
              >
                <CloudUpload size={16} /> Push to Hugging Face
              </button>
              <button
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-2"
                disabled={deleteMutation.isPending}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} /> Delete Dataset Repo
              </button>
            </div>
            {!canPush && (
              <p className="mt-2 text-xs text-slate-500">Push is disabled until there are approved records with quality ≥ 4.</p>
            )}
          </div>

          <div className="space-y-6">
            {preview?.data && (
              <div className="glass p-6">
                <h2 className="mb-4 text-sm font-semibold text-slate-300">Preview / Splits</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total pairs</span>
                    <span className="font-mono text-slate-200">{preview.data.pairs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Train (80%)</span>
                    <span className="font-mono text-emerald-300">{preview.data.splits.train}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validation (10%)</span>
                    <span className="font-mono text-amber-300">{preview.data.splits.validation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Test (10%)</span>
                    <span className="font-mono text-sky-300">{preview.data.splits.test}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maay → Maxaa</span>
                    <span className="font-mono text-slate-200">{preview.data.stats.maay_to_maxaa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maxaa → Maay</span>
                    <span className="font-mono text-slate-200">{preview.data.stats.maxaa_to_maay}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="glass p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <History size={16} className="text-indigo-300" /> Push History
              </h2>
              {!history?.data?.length ? (
                <p className="text-sm text-slate-500">No pushes yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.data.map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                      <div>
                        <p className="text-slate-200">{h.commit_message}</p>
                        <p className="text-xs text-slate-500">
                          {h.profiles?.full_name ?? "admin"} · {new Date(h.pushed_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] ${
                          h.status === "success"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : h.status === "deleted"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass max-w-md w-full p-6 space-y-4 rounded-2xl border border-rose-500/30">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold text-slate-100">Delete Dataset Repository?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-mono text-indigo-300">{s?.repoId}</span> from Hugging Face?
              This action will completely remove the repository and all uploaded dataset files on Hugging Face.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-secondary text-sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="rounded-xl border border-rose-500/40 bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 transition"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Repository"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}