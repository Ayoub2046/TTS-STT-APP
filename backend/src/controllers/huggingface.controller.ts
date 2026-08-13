import { Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
import { getSupabase } from "../config/supabase.js";
import { logAudit } from "../services/audit.service.js";
import {
  fetchApprovedRecords,
  previewDataset,
  pushToHuggingFace,
  deleteFromHuggingFace,
  HfPushResult,
} from "../services/huggingface.service.js";

export async function getStatus(_req: Request, res: Response): Promise<void> {
  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .select("status, quality_score", { count: "exact" });

  if (error) throw new ApiError(500, "Failed to load HF status.");

  const rows = data ?? [];
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const totalSubmissions = rows.filter((r) => r.status !== "draft").length;
  const effectiveCount = approvedCount > 0 ? approvedCount : totalSubmissions;

  res.json({
    success: true,
    data: {
      configured: Boolean(env.HF_TOKEN),
      repoId: env.HF_DATASET_REPO,
      approvedRecords: effectiveCount,
      qualityGte4: effectiveCount,
      readyToPush: effectiveCount > 0 && Boolean(env.HF_TOKEN),
    },
  });
}

export async function getPreview(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const pairs = await fetchApprovedRecords();
  if (pairs.length === 0) {
    throw new ApiError(400, "No approved records available to build the dataset.");
  }
  const preview = await previewDataset(pairs);

  await logAudit({
    userId: user.id,
    action: "huggingface.preview",
    entityType: "datasets",
    metadata: { records: pairs.length },
  });

  res.json({ success: true, data: preview });
}

export async function pushDataset(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { version, commitMessage } = req.body;

  const pairs = await fetchApprovedRecords();
  if (pairs.length === 0) {
    throw new ApiError(400, "No approved records available to push.");
  }

  const message = `${commitMessage} v${version}`;
  const result: HfPushResult = await pushToHuggingFace({
    repoId: env.HF_DATASET_REPO,
    commitMessage: message,
    pairs,
  });

  const { data: versionRow, error: versionError } = await getSupabase()
    .from("dataset_versions")
    .insert({
      version,
      total_records: pairs.length,
      approved_records: pairs.length,
      jsonl_url: `https://huggingface.co/datasets/${env.HF_DATASET_REPO}/resolve/main/data/train.jsonl`,
      created_by: user.id,
    })
    .select()
    .single();

  if (versionError) {
    console.error("[hf:push] version insert failed", versionError);
  }

  await getSupabase().from("hf_push_logs").insert({
    dataset_version_id: versionRow?.id ?? null,
    repo_id: env.HF_DATASET_REPO,
    commit_id: result.revision,
    commit_message: message,
    status: "success",
    pushed_by: user.id,
  });

  await logAudit({
    userId: user.id,
    action: "huggingface.push",
    entityType: "datasets",
    metadata: { repoId: env.HF_DATASET_REPO, version, records: pairs.length },
  });

  res.json({
    success: true,
    data: {
      repoId: result.repoId,
      revision: result.revision,
      splits: result.splits,
      message: `Dataset v${version} pushed to Hugging Face.`,
    },
  });
}

export async function getHistory(_req: Request, res: Response): Promise<void> {
  const { data, error } = await getSupabase()
    .from("hf_push_logs")
    .select("*, profiles!pushed_by(full_name)")
    .order("pushed_at", { ascending: false })
    .limit(50);

  if (error) throw new ApiError(500, "Failed to load push history.");
  res.json({ success: true, data });
}

export async function deleteDataset(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const repoId = env.HF_DATASET_REPO;

  const result = await deleteFromHuggingFace({ repoId });

  await getSupabase().from("hf_push_logs").insert({
    repo_id: repoId,
    commit_id: null,
    commit_message: `Dataset repository deleted from Hugging Face`,
    status: "deleted",
    pushed_by: user.id,
  });

  await logAudit({
    userId: user.id,
    action: "huggingface.delete",
    entityType: "datasets",
    metadata: { repoId },
  });

  res.json({
    success: true,
    data: {
      repoId: result.repoId,
      message: `Repository '${result.repoId}' was deleted from Hugging Face.`,
    },
  });
}