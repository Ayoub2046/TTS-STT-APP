import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
import { commit, createRepo, deleteRepo } from "@huggingface/hub";
import {
  DatasetPair,
  generateStats,
  generateDatasetCard,
  toJsonl,
  toCsv,
} from "./dataset.service.js";

export interface HfPushResult {
  repoId: string;
  revision: string;
  pushedAt: string;
  splits: { train: number; validation: number; test: number };
}

/** Fetch approved records and build dataset pairs from the database. */
export async function fetchApprovedRecords(): Promise<DatasetPair[]> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  let { data, error } = await supabase
    .from("translation_pairs")
    .select("source_text, target_text, source_language, target_language")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) throw new ApiError(500, `Failed to fetch approved records: ${error.message}`);

  // Fallback: If no approved records exist yet, export all non-draft submissions
  if (!data || data.length === 0) {
    const fallback = await supabase
      .from("translation_pairs")
      .select("source_text, target_text, source_language, target_language")
      .neq("status", "draft")
      .order("created_at", { ascending: true });

    if (!fallback.error && fallback.data) {
      data = fallback.data;
    }
  }

  const pairs: DatasetPair[] = [];
  for (const row of data ?? []) {
    pairs.push({ source: row.source_text, target: row.target_text, source_lang: row.source_language, target_lang: row.target_language });
    pairs.push({ source: row.target_text, target: row.source_text, source_lang: row.target_language, target_lang: row.source_language });
  }
  return pairs;
}

function buildFiles(pairs: DatasetPair[]) {
  const stats = generateStats(pairs);
  const card = generateDatasetCard(stats);
  const allJsonl = toJsonl(pairs);
  const allCsv = toCsv(pairs);

  const files = [
    { path: "README.md", content: card },
    { path: "train.jsonl", content: allJsonl },
    { path: "data.jsonl", content: allJsonl },
    { path: "data/train.jsonl", content: allJsonl },
    { path: "data/data.csv", content: allCsv },
    { path: "data.csv", content: allCsv },
  ];
  return { stats, files, total: pairs.length };
}

/** Push dataset files to Hugging Face Hub using the official @huggingface/hub package. */
export async function pushToHuggingFace(input: {
  repoId: string;
  commitMessage: string;
  pairs: DatasetPair[];
}): Promise<HfPushResult> {
  if (!env.HF_TOKEN) throw new ApiError(500, "HF_TOKEN is not configured on the backend.");

  const cleanRepo = input.repoId
    .trim()
    .replace(/^https?:\/\/huggingface\.co\/datasets\//, "")
    .replace(/\/$/, "");

  const credentials = { accessToken: env.HF_TOKEN };
  const repo = { type: "dataset" as const, name: cleanRepo };

  // Ensure the repository exists (create if it doesn't)
  try {
    await createRepo({ repo, credentials, private: false });
  } catch {
    // Ignore — repo already exists
  }

  const { files, total } = buildFiles(input.pairs);

  // Use official @huggingface/hub commit function
  const result = await commit({
    repo,
    credentials,
    title: input.commitMessage,
    operations: files.map((f) => ({
      operation: "addOrUpdate" as const,
      path: f.path,
      content: new Blob([f.content], { type: "text/plain" }),
    })),
  });

  const revision = (result as { commit?: { oid?: string } })?.commit?.oid ?? new Date().toISOString();

  return {
    repoId: cleanRepo,
    revision,
    pushedAt: new Date().toISOString(),
    splits: { train: total, validation: 0, test: 0 },
  };
}

export async function deleteFromHuggingFace(input: {
  repoId: string;
}): Promise<{ repoId: string; deletedAt: string }> {
  if (!env.HF_TOKEN) throw new ApiError(500, "HF_TOKEN is not configured on the backend.");

  const cleanRepo = input.repoId
    .trim()
    .replace(/^https?:\/\/huggingface\.co\/datasets\//, "")
    .replace(/\/$/, "");

  const credentials = { accessToken: env.HF_TOKEN };
  const repo = { type: "dataset" as const, name: cleanRepo };

  try {
    await deleteRepo({ repo, credentials });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ApiError(502, `Failed to delete Hugging Face dataset repository (${cleanRepo}): ${msg}`);
  }

  return {
    repoId: cleanRepo,
    deletedAt: new Date().toISOString(),
  };
}

export async function previewDataset(pairs: DatasetPair[]): Promise<{
  pairs: DatasetPair[];
  splits: { train: number; validation: number; test: number };
  stats: Record<string, number | string>;
}> {
  const stats = generateStats(pairs);
  return {
    pairs,
    splits: { train: pairs.length, validation: 0, test: 0 },
    stats,
  };
}
