import "server-only";

/**
 * Audit logs repository — read-only.
 *
 * Org-scoped via `.in("organization_id", orgIds)`. No writes in this
 * phase; creation of audit_logs is reserved for a later phase's
 * change-capture helpers.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { AuditLogRow } from "@modules/audit/logs.dto";

const TABLE = "audit_logs";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, actor_user_id, actor_type, entity_type, entity_id, " +
  "event_type, reason_ref_id, old_values_json, new_values_json, diff_json, " +
  "source_channel, ip_address, user_agent, metadata_json, occurred_at, created_at";

export async function listInOrgs(orgIds: string[]): Promise<AuditLogRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("occurred_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list audit logs", error);
  return (data ?? []) as unknown as AuditLogRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<AuditLogRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load audit log", error);
  return (data as unknown as AuditLogRow) ?? null;
}
