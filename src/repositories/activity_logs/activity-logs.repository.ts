import "server-only";

/**
 * Activity logs repository — read-only.
 *
 * Org-scoped via `.in("organization_id", orgIds)`. No writes in this
 * phase; creation of activity_logs is reserved for a later phase's
 * event-emission helpers.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ActivityLogRow } from "@modules/audit/logs.dto";

const TABLE = "activity_logs";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, user_id, actor_type, entity_type, entity_id, " +
  "action_code, action_label, description, source_channel, ip_address, user_agent, " +
  "metadata_json, occurred_at, created_at";

export async function listInOrgs(orgIds: string[]): Promise<ActivityLogRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("occurred_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list activity logs", error);
  return (data ?? []) as unknown as ActivityLogRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<ActivityLogRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load activity log", error);
  return (data as unknown as ActivityLogRow) ?? null;
}
