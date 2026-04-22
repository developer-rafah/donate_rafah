import "server-only";

/**
 * Points rules repository — ops-side reads.
 *
 * Org-scoped via `.in("organization_id", orgIds)`.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { PointsRuleRow } from "@modules/recognition/points.dto";

const TABLE = "points_rules";

const SELECT_COLUMNS =
  "id, organization_id, rule_code, name_ar, name_en, description, " +
  "trigger_event_code, points_value, calculation_mode, condition_payload_json, " +
  "max_repeat_count, is_active, start_at, end_at, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<PointsRuleRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("rule_code", { ascending: true });

  if (error) throw new DependencyError("Failed to list points rules", error);
  return (data ?? []) as unknown as PointsRuleRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<PointsRuleRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load points rule", error);
  return (data as unknown as PointsRuleRow) ?? null;
}
