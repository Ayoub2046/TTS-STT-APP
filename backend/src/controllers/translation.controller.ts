import { Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { validateTranslation, normalizeSentence } from "../services/validation.service.js";
import { logAudit } from "../services/audit.service.js";
import { ApiError } from "../middleware/error.js";
import { DashboardStats } from "../types/index.js";

async function getExistingSources(): Promise<string[]> {
  const { data } = await getSupabase()
    .from("translation_pairs")
    .select("source_text")
    .limit(100000);
  if (!data) return [];
  return data.map((r) => (r as { source_text: string }).source_text);
}

export async function createTranslation(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { sourceLanguage, targetLanguage, sourceText, targetText, domain, status } = req.body;

  const validation = validateTranslation({
    sourceText: normalizeSentence(sourceText),
    targetText: normalizeSentence(targetText),
    existingSources: await getExistingSources(),
  });

  const { data: inserted, error } = await getSupabase()
    .from("translation_pairs")
    .insert({
      contributor_id: user.id,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      source_text: normalizeSentence(sourceText),
      target_text: normalizeSentence(targetText),
      domain,
      status: status === "draft" ? "draft" : "pending",
      validation_flags: validation.issues,
    })
    .select()
    .single();

  if (error) {
    console.error("[translation:create]", error);
    throw new ApiError(500, "Failed to save translation.");
  }

  await logAudit({
    userId: user.id,
    action: "translation.create",
    entityType: "translation_pairs",
    entityId: inserted.id,
    metadata: { sourceLanguage, targetLanguage, warningCount: validation.issues.length },
  });

  res.status(201).json({
    success: true,
    message: validation.valid
      ? "Translation submitted successfully."
      : "Translation saved with warnings.",
    data: {
      id: inserted.id,
      status: inserted.status,
      validation: {
        valid: validation.valid,
        issues: validation.issues,
      },
    },
  });
}

export async function listTranslations(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { status, domain, direction, search, page = "1", limit = "50" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  let query = getSupabase()
    .from("translation_pairs")
    .select("*, profiles!contributor_id(full_name)", { count: "exact" });

  if (user.role === "contributor") {
    query = query.eq("contributor_id", user.id);
  }

  if (status !== undefined && status !== null && status !== "") query = query.eq("status", status);
  if (domain) query = query.eq("domain", domain);
  if (direction) {
    const [src, tgt] = direction.split("-to-");
    if (src && tgt) {
      query = query.eq("source_language", src).eq("target_language", tgt);
    }
  }
  if (search) {
    query = query.or(`source_text.ilike.%${search}%,target_text.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[translation:list]", error);
    throw new ApiError(500, "Failed to list translations.");
  }

  res.json({
    success: true,
    data: data,
    meta: { page: pageNum, limit: limitNum, total: count ?? 0 },
  });
}

export async function getTranslation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .select("*, profiles!contributor_id(full_name)")
    .eq("id", id)
    .single();

  if (error) throw new ApiError(404, "Translation not found.");
  res.json({ success: true, data });
}

export async function updateTranslation(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { data: existing, error: fetchError } = await getSupabase()
    .from("translation_pairs")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) throw new ApiError(404, "Translation not found.");

  const isOwner = existing.contributor_id === user.id;
  const editable = isOwner && ["draft", "pending", "correction_requested"].includes(existing.status);
  if (!editable && user.role !== "admin" && user.role !== "reviewer") {
    throw new ApiError(403, "You can only edit your own pending or draft submissions.");
  }

  const merge = { ...existing, ...req.body };
  const validation = validateTranslation({
    sourceText: merge.source_text,
    targetText: merge.target_text,
    existingSources: await getExistingSources(),
  });

  const nextStatus = merge.status === "draft" ? "draft" : "pending";

  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .update({
      source_text: normalizeSentence(merge.source_text),
      target_text: normalizeSentence(merge.target_text),
      domain: merge.domain,
      validation_flags: validation.issues,
      status: nextStatus,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new ApiError(500, "Failed to update translation.");

  await logAudit({
    userId: user.id,
    action: "translation.update",
    entityType: "translation_pairs",
    entityId: id,
  });

  res.json({
    success: true,
    data: { ...data, validation: { valid: validation.valid, issues: validation.issues } },
  });
}

export async function deleteTranslation(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  const { data: existing } = await getSupabase()
    .from("translation_pairs")
    .select("contributor_id")
    .eq("id", id)
    .single();

  if (existing && existing.contributor_id !== user.id && user.role !== "admin") {
    throw new ApiError(403, "You can only delete your own submissions.");
  }

  const { error } = await getSupabase().from("translation_pairs").delete().eq("id", id);
  if (error) throw new ApiError(500, "Failed to delete translation.");

  await logAudit({
    userId: user.id,
    action: "translation.delete",
    entityType: "translation_pairs",
    entityId: id,
  });

  res.json({ success: true, message: "Translation deleted." });
}

export async function getMyStats(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  const { data, error } = await getSupabase()
    .from("translation_pairs")
    .select("status, contributor_id");

  if (error) throw new ApiError(500, "Failed to load stats.");

  const mine = (data ?? []).filter((r) => r.contributor_id === user.id);
  const counts: Record<string, number> = {};
  for (const r of mine) {
    const status = r.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  const draft = counts["draft"] ?? 0;
  const submitted = mine.length;
  const approved = counts["approved"] ?? 0;
  const stats: DashboardStats = {
    draft,
    submitted: submitted - draft,
    approved,
    pending: counts["pending"] ?? 0,
    rejected: counts["rejected"] ?? 0,
    correctionRequested: counts["correction_requested"] ?? 0,
    approvalRate: submitted ? Math.round((approved / submitted) * 100) : 0,
  };

  res.json({ success: true, data: stats });
}