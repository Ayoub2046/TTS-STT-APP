import { Request, Response } from "express";
import { getSupabase } from "../config/supabase.js";
import { ApiError } from "../middleware/error.js";
import { logAudit } from "../services/audit.service.js";

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(500, "Failed to list users.");
  res.json({ success: true, data });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.id;
  const { id } = req.params;
  const { role, isActive, fullName } = req.body as {
    role?: "contributor" | "reviewer" | "admin";
    isActive?: boolean;
    fullName?: string;
  };

  const patch: Record<string, unknown> = {};
  if (role) patch.role = role;
  if (typeof isActive === "boolean") patch.is_active = isActive;
  if (fullName) patch.full_name = fullName;

  const { data, error } = await getSupabase().from("profiles").update(patch).eq("id", id).select().single();
  if (error) throw new ApiError(500, "Failed to update user.");

  await logAudit({
    userId: adminId,
    action: "admin.user.update",
    entityType: "profiles",
    entityId: id,
    metadata: patch,
  });

  res.json({ success: true, data });
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { limit = "50" } = req.query as Record<string, string>;
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

  const { data, error } = await getSupabase()
    .from("audit_logs")
    .select("*, profiles!user_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limitNum);

  if (error) throw new ApiError(500, "Failed to load audit logs.");
  res.json({ success: true, data });
}

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  const supabase = getSupabase();

  const [totalUsersRes, authUsersRes, contributorsRes, reviewersRes, translations, reviews, pending] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } })),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "contributor"),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "reviewer"),
    supabase.from("translation_pairs").select("status, quality_score"),
    supabase.from("reviews").select("id", { count: "exact" }),
    supabase.from("translation_pairs").select("id", { count: "exact" }).eq("status", "pending"),
  ]);

  const profileCount = totalUsersRes.data?.length ?? totalUsersRes.count ?? 0;
  const authCount = authUsersRes.data?.users?.length ?? 0;
  const totalUsers = Math.max(profileCount, authCount);

  const rows = (translations.data ?? []) as Array<{ status: string; quality_score: number | null }>;
  const byStatus: Record<string, number> = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  res.json({
    success: true,
    data: {
      totalUsers,
      contributors: contributorsRes.data?.length ?? contributorsRes.count ?? 0,
      reviewers: reviewersRes.data?.length ?? reviewersRes.count ?? 0,
      totalSentences: rows.length,
      approved: byStatus["approved"] ?? 0,
      rejected: byStatus["rejected"] ?? 0,
      pending: pending.data?.length ?? pending.count ?? 0,
      qualityGte4: rows.filter((r) => (r.quality_score ?? 0) >= 4).length,
      totalReviews: reviews.data?.length ?? reviews.count ?? 0,
    },
  });
}