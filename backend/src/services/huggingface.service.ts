import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";
import {
  DatasetPair,
  DatasetSplits,
  splitDataset,
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
  const { data, error } = await supabase
    .from("translation_pairs")
    .select("source_text, target_text, source_language, target_language")
    .eq("status", "approved")
    .gte("quality_score", 4)
    .order("created_at", { ascending: true });

  if (error) throw new ApiError(500, `Failed to fetch approved records: ${error.message}`);

  const pairs: DatasetPair[] = [];
  for (const row of data ?? []) {
    pairs.push({ source: row.source_text, target: row.target_text, source_lang: row.source_language, target_lang: row.target_language });
    pairs.push({ source: row.target_text, target: row.source_text, source_lang: row.target_language, target_lang: row.source_language });
  }
  return pairs;
}

function buildFiles(pairs: DatasetPair[], commitMessage: string) {
  const splitResult: DatasetSplits = splitDataset(pairs, 0.8, 0.1);
  const stats = generateStats(pairs);
  const card = generateDatasetCard(stats);
  const files: Array<{ path: string; content: string }> = [
    { path: "README.md", content: card },
    { path: "data/train.jsonl", content: toJsonl(splitResult.train) },
    { path: "data/validation.jsonl", content: toJsonl(splitResult.validation) },
    { path: "data/test.jsonl", content: toJsonl(splitResult.test) },
    { path: "data/train.csv", content: toCsv(splitResult.train) },
    { path: "data/validation.csv", content: toCsv(splitResult.validation) },
    { path: "data/test.csv", content: toCsv(splitResult.test) },
    { path: "metadata/dataset_stats.json", content: JSON.stringify(stats, null, 2) },
    { path: "metadata/sources.json", content: JSON.stringify({ source: "MaayMaxaa DataHub community contributions", commit_message: commitMessage }, null, 2) },
  ];
  return { splits: splitResult, stats, files };
}

/** Push dataset files to the Hugging Face Hub using the official files upload endpoint. */
export async function pushToHuggingFace(input: {
  repoId: string;
  commitMessage: string;
  pairs: DatasetPair[];
}): Promise<HfPushResult> {
  if (!env.HF_TOKEN) throw new ApiError(500, "HF_TOKEN is not configured on the backend.");

  const { splits, files } = buildFiles(input.pairs, input.commitMessage);

  // Upload all files in one commit via the dataset upload endpoint.
  const form = new FormData();
  for (const file of files) {
    form.append("file", new Blob([file.content], { type: "text/plain" }), file.path);
  }
  form.append("commit_message", input.commitMessage);

  const response = await fetch(
    `https://huggingface.co/api/datasets/${encodeURIComponent(input.repoId)}/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.HF_TOKEN}` },
      body: form,
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(502, `Hugging Face upload failed (${response.status}): ${body.slice(0, 400)}`);
  }

  const result = (await response.json()) as { commit_id?: string; commit?: { id?: string } };
  const revision = result.commit_id ?? result.commit?.id ?? new Date().toISOString();

  return {
    repoId: input.repoId,
    revision,
    pushedAt: new Date().toISOString(),
    splits: { train: splits.train.length, validation: splits.validation.length, test: splits.test.length },
  };
}

export async function previewDataset(pairs: DatasetPair[]): Promise<{
  pairs: DatasetPair[];
  splits: { train: number; validation: number; test: number };
  stats: Record<string, number | string>;
}> {
  const splits = splitDataset(pairs, 0.8, 0.1);
  const stats = generateStats(pairs);
  return {
    pairs,
    splits: { train: splits.train.length, validation: splits.validation.length, test: splits.test.length },
    stats,
  };
}