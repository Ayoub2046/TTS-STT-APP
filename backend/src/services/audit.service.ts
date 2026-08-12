import { getSupabase } from "../config/supabase.js";

interface AuditEntry {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await getSupabase()
      .from("audit_logs")
      .insert({
        user_id: entry.userId,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId ?? null,
        metadata: entry.metadata ?? {},
      });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}