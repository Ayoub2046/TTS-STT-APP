import { Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { env } from "../config/env.js";

export async function getPublicStats(_req: Request, res: Response): Promise<void> {
  const supabase = getSupabase();

  const [usersRes, pairsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("translation_pairs").select("status, quality_score, source_language, target_language"),
  ]);

  const totalUsers = usersRes.data?.length ?? usersRes.count ?? 0;
  const rows = pairsRes.data ?? [];

  const nonDraftRows = rows.filter((r) => r.status !== "draft");
  const approvedRows = rows.filter((r) => r.status === "approved");
  const highQualityRows = rows.filter((r) => (r.quality_score ?? 0) >= 4 || r.status === "approved");

  const maayToMaxaa = rows.filter(
    (r) => (r.source_language === "so-maay" || r.source_language === "maay")
  ).length;
  const maxaaToMaay = rows.filter(
    (r) => (r.source_language === "so-maxaa" || r.source_language === "so" || r.source_language === "maxaa")
  ).length;

  res.json({
    success: true,
    data: {
      totalUsers: totalUsers,
      totalSentences: nonDraftRows.length,
      approvedSentences: approvedRows.length > 0 ? approvedRows.length : nonDraftRows.length,
      highQualitySentences: highQualityRows.length > 0 ? highQualityRows.length : nonDraftRows.length,
      maayToMaxaa,
      maxaaToMaay,
      hfRepoId: env.HF_DATASET_REPO,
      hfRepoUrl: `https://huggingface.co/datasets/${env.HF_DATASET_REPO}`,
    },
  });
}
