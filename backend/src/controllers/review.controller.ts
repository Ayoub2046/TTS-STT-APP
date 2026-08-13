import { Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { validateTranslation, normalizeSentence } from "../services/validation.service.js";
import { logAudit } from "../services/audit.service.js";
import { ApiError } from "../middleware/error.js";
import { ReviewDecision, TranslationStatus } from "../types/index.js";

const STATUS_BY_DECISION: Record<ReviewDecision, TranslationStatus> = {
  approve: "approved",
  reject: "rejected",
  request_correction: "correction_requested",
};

async function getPendingCount(): Promise<number> {
  const { count } = await getSupabase()
    .from("translation_pairs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function getPendingQueue(req: Request, res: Response): Promise<void> {
  const { limit = "20", page = "1" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const from = (pageNum - 1) * limitNum;
  const to = from + limitNum - 1;

  const { data, error, count } = await getSupabase()
    .from("translation_pairs")
    .select("*, profiles!contributor_id(full_name)", { count: "exact" })
    .in("status", ["pending", "correction_requested"])
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw new ApiError(500, "Failed to load review queue.");

  res.json({
    success: true,
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total: count ?? 0,
      pendingDisplay: await getPendingCount(),
    },
  });
}

export async function submitReview(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { decision, comment, correctedSource, correctedTarget, qualityScore } = req.body as {
    decision: ReviewDecision;
    comment?: string;
    correctedSource?: string;
    correctedTarget?: string;
    qualityScore?: number;
  };

  const { data: existing, error: fetchError } = await getSupabase()
    .from("translation_pairs")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) throw new ApiError(404, "Translation not found.");
  if (!["pending", "correction_requested"].includes(existing.status)) {
    throw new ApiError(409, "Only pending or correction-requested translations can be reviewed.");
  }
  if (existing.contributor_id === user.id && user.role !== "admin") {
    throw new ApiError(403, "You cannot review your own submission.");
  }

  const originalSource = existing.source_text;
  const originalTarget = existing.target_text;
  let finalSource = originalSource;
  let finalTarget = originalTarget;

  if (correctedSource) finalSource = normalizeSentence(correctedSource);
  if (correctedTarget) finalTarget = normalizeSentence(correctedTarget);
  const hadCorrection = finalSource !== originalSource || finalTarget !== originalTarget;

  const finalStatus = STATUS_BY_DECISION[decision];
  const score = decision === "approve" ? qualityScore : null;

  if (decision === "approve") {
    const validation = validateTranslation({
      sourceText: finalSource,
      targetText: finalTarget,
      existingSources: [],
    });
    if (!validation.valid) {
      throw new ApiError(422, "Cannot approve: corrected text fails validation.");
    }
  }

  const { error: reviewError } = await getSupabase().from("reviews").insert({
    translation_id: id,
    reviewer_id: user.id,
    decision,
    comment: comment ?? null,
    original_source: originalSource,
    original_target: originalTarget,
    corrected_source: hadCorrection ? finalSource : null,
    corrected_target: hadCorrection ? finalTarget : null,
    quality_score: score,
  });
  if (reviewError) throw new ApiError(500, "Failed to save review.");

  const { error: updateError } = await getSupabase()
    .from("translation_pairs")
    .update({
      status: finalStatus,
      source_text: finalSource,
      target_text: finalTarget,
      quality_score: score,
      approved_at: decision === "approve" ? new Date().toISOString() : null,
      approved_by: decision === "approve" ? user.id : null,
      review_count: (existing.review_count ?? 0) + 1,
    })
    .eq("id", id);

  if (updateError) throw new ApiError(500, "Failed to update translation status.");

  await logAudit({
    userId: user.id,
    action: `review.${decision}`,
    entityType: "translation_pairs",
    entityId: id,
    metadata: { qualityScore: score, hadCorrection },
  });

  if (decision === "request_correction" || decision === "reject") {
    await getSupabase().from("notifications").insert({
      user_id: existing.contributor_id,
      title: decision === "request_correction" ? "Correction requested" : "Translation rejected",
      message:
        decision === "request_correction"
          ? "A reviewer requested a correction on one of your translations."
          : "One of your translations was rejected.",
      type: decision,
      entity_type: "translation_pairs",
      entity_id: id,
    });
  }

  res.json({ success: true, data: { id, status: finalStatus } });
}

export async function getReviewHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const { data, error } = await getSupabase()
    .from("reviews")
    .select("*, profiles!reviewer_id(full_name)")
    .eq("translation_id", id)
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(500, "Failed to load review history.");
  res.json({ success: true, data });
}