import { Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { ApiError } from "../middleware/error.js";
import { normalizeSentence } from "../services/validation.service.js";
import { logAudit } from "../services/audit.service.js";
import { buildDatasetPairs, splitDataset, DatasetPair } from "../services/dataset.service.js";

export async function listDatasets(_req: Request, res: Response): Promise<void> {
  const { data, error } = await getSupabase()
    .from("datasets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(500, "Failed to list datasets.");
  res.json({ success: true, data });
}

export async function createDataset(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { name, description, sourceLanguage, targetLanguage } = req.body;

  const { data, error } = await getSupabase()
    .from("datasets")
    .insert({
      name,
      description: description ?? null,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      status: "draft",
      version: "0.0.1",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new ApiError(500, "Failed to create dataset.");

  await logAudit({
    userId: user.id,
    action: "dataset.create",
    entityType: "datasets",
    entityId: data.id,
    metadata: { name },
  });

  res.status(201).json({ success: true, data });
}

export async function getDataset(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { data, error } = await getSupabase()
    .from("datasets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new ApiError(404, "Dataset not found.");
  res.json({ success: true, data });
}

export async function getDatasetStats(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { sourceLanguage, targetLanguage, qualityThreshold = "4" } = req.query as Record<string, string>;
  const threshold = Math.min(5, Math.max(1, parseInt(qualityThreshold, 10) || 4));

  const statuses = ["draft", "pending", "under_review", "correction_requested", "approved", "rejected", "published"];

  let query = getSupabase().from("translation_pairs").select("status, source_language, target_language, quality_score, domain");

  if (sourceLanguage) query = query.eq("source_language", sourceLanguage);
  if (targetLanguage) query = query.eq("target_language", targetLanguage);

  const { data, error } = await query;
  if (error) throw new ApiError(500, "Failed to load dataset stats.");

  const rows = (data ?? []) as Array<{
    status: string;
    source_language: string;
    target_language: string;
    quality_score: number | null;
    domain: string | null;
    validation_flags?: unknown;
  }>;

  const counts: Record<string, number> = {};
  for (const s of statuses) counts[s] = 0;
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const total = rows.length;
  const approved = counts["approved"];
  const qualityOk = rows.filter((r) => (r.quality_score ?? 0) >= threshold).length;
  const maayToMaxaa = rows.filter((r) => r.source_language === "maay" && r.target_language === "maxaa").length;
  const maxaaToMaay = rows.filter((r) => r.source_language === "maxaa" && r.target_language === "maay").length;

  const domains: Record<string, number> = {};
  for (const r of rows) {
    const d = r.domain ?? "general";
    domains[d] = (domains[d] ?? 0) + 1;
  }

  res.json({
    success: true,
    data: {
      total,
      approved,
      approvedPercent: total ? Math.round((approved / total) * 100) : 0,
      pending: counts["pending"],
      rejected: counts["rejected"],
      qualityOk,
      qualityOkPercent: total ? Math.round((qualityOk / total) * 100) : 0,
      duplicates: 0,
      maayToMaxaa,
      maxaaToMaay,
      domains,
      qualityThreshold: threshold,
      contributorCount: user.role === "admin" ? new Set(rows.map((r) => (r as { contributor_id?: string }).contributor_id)).size : undefined,
    },
  });
}

export async function validateDataset(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { sourceLanguage, targetLanguage } = req.query as Record<string, string>;

  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) throw new ApiError(500, "Failed to validate dataset.");

  const rows = (data ?? []) as Array<{
    id: string;
    source_text: string;
    target_text: string;
    source_language: string;
    target_language: string;
    domain: string | null;
    quality_score: number | null;
    review_count: number;
  }>;

  let filtered = rows;
  if (sourceLanguage) filtered = filtered.filter((r) => r.source_language === sourceLanguage);
  if (targetLanguage) filtered = filtered.filter((r) => r.target_language === targetLanguage);

  const issues: Array<{ id: string; type: string; message: string }> = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const row of filtered) {
    const src = normalizeSentence(row.source_text);
    const key = src.toLowerCase();
    if (seen.has(key)) {
      duplicateCount++;
      issues.push({ id: row.id, type: "duplicate", message: "Duplicate source sentence." });
    }
    seen.add(key);
    if (!src || src.length < 2) {
      issues.push({ id: row.id, type: "empty_or_short", message: "Source text empty or too short." });
    }
  }

  const clean = filtered.filter((row) => {
    const key = normalizeSentence(row.source_text).toLowerCase();
    const isDuplicate = (() => {
      let found = 0;
      for (const s of seen) if (s === key) found++;
      return found > 1;
    })();
    return !isDuplicate;
  });

  const cleanTotal = clean.length;

  await logAudit({
    userId: user.id,
    action: "dataset.validate",
    entityType: "datasets",
    metadata: { issues: issues.length, cleanTotal },
  });

  res.json({
    success: true,
    data: {
      totalRecords: filtered.length,
      cleanRecords: cleanTotal,
      duplicates: duplicateCount,
      issues: issues.slice(0, 50),
    },
  });
}

export async function exportDataset(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { format = "jsonl", sourceLanguage, targetLanguage, includeReverse = "true", qualityThreshold = "4" } = req.query as Record<string, string>;

  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .select("*")
    .eq("status", "approved")
    .gte("quality_score", Math.min(5, Math.max(1, parseInt(qualityThreshold, 10) || 4)))
    .order("created_at", { ascending: true });

  if (error) throw new ApiError(500, "Failed to export dataset.");

  const rows = (data ?? []) as Array<{
    source_text: string;
    target_text: string;
    source_language: string;
    target_language: string;
  }>;

  let filtered = rows;
  if (sourceLanguage) filtered = filtered.filter((r) => r.source_language === sourceLanguage);
  if (targetLanguage) filtered = filtered.filter((r) => r.target_language === targetLanguage);

  const pairs = buildDatasetPairs(filtered);
  const finalPairs: DatasetPair[] = includeReverse === "true" ? pairs : pairs.filter((p) => p.source_lang !== p.target_lang && !(p.source_lang === "maxaa" && p.target_lang === "maay"));
  const splits = splitDataset(finalPairs, 0.8, 0.1);

  const output: Record<string, (xs: DatasetPair[]) => string[]> = {
    jsonl: (xs: DatasetPair[]) => xs.map((p) => JSON.stringify(p)),
    json: (xs: DatasetPair[]) => [JSON.stringify(xs, null, 2)],
    csv: (xs: DatasetPair[]) => [
      "source,target,source_lang,target_lang",
      ...xs.map((p) => `${JSON.stringify(p.source)},${JSON.stringify(p.target)},${p.source_lang},${p.target_lang}`),
    ],
  };

  const render = output[format as keyof typeof output];
  if (!render) throw new ApiError(400, "Unsupported format. Use jsonl, json, or csv.");

  const filename = `dataset-${format}.${format === "jsonl" ? "jsonl" : format === "csv" ? "csv" : "json"}`;
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(render(splits.train).join("\n"));

  await logAudit({
    userId: user.id,
    action: "dataset.export",
    entityType: "datasets",
    metadata: { format, records: finalPairs.length, includeReverse },
  });
}