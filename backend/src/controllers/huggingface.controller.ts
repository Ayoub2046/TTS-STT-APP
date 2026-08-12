import { Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
import { getSupabase } from "../config/supabase.js";
import { logAudit } from "../services/audit.service.js";
import {
  fetchApprovedRecords,
  previewDataset,
  pushToHuggingFace,
  HfPushResult,
} from "../services/huggingface.service.js";

export async function getStatus(_req: Request, res: Response): Promise<void> {
  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .select("status, quality_score", { count: "exact" })
    .eq("status", "approved");

  if (error) throw new ApiError(500, "Failed to load HF status.");

  const approvedCount = data?.length ?? 0;
  const qualityOk = (data ?? []).filter((r) => (r as { quality_score: number | null | undefined }).quality_score! >= 4).length;

  res.json({
    success: true,
    data: {
      configured: Boolean(env.HF_TOKEN),
      repoId: env.HF_DATASET_REPO,
      approvedRecords: approvedCount,
      qualityGte4: qualityOk,
      readyToPush: approvedCount > 0 && qualityOk > 0 && Boolean(env.HF_TOKEN),
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
    .select("*, profiles(full_name)")
    .order("pushed_at", { ascending: false })
    .limit(50);

  if (error) throw new ApiError(500, "Failed to load push history.");
  res.json({ success: true, data });
}