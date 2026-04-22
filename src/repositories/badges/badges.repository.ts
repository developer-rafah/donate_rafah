import "server-only";

/**
 * Badge awards repository — donor-scoped reads.
 *
 * Real schema:
 *   public.badge_awards (
 *     id, organization_id, badge_id, donor_id,
 *     award_reason, award_source_entity_type, award_source_entity_id,
 *     awarded_at, awarded_by, created_at
 *   )
 *   public.badges (
 *     id, organization_id, badge_code, name_ar, name_en, description,
 *     icon_file_path, badge_level, criteria_payload_json,
 *     is_active, is_public, created_at, updated_at, created_by, updated_by
 *   )
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorBadgeAwardRow } from "@modules/donor/recognition.dto";

const TABLE = "badge_awards";

export async function listByDonorId(donorId: string): Promise<DonorBadgeAwardRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
        id,
        donor_id,
        awarded_at,
        award_reason,
        badges ( id, badge_code, name_ar, name_en, icon_file_path, badge_level )
      `
    )
    .eq("donor_id", donorId)
    .order("awarded_at", { ascending: false });

  if (error) {
    throw new DependencyError("Failed to list badge awards for donor", error);
  }
  return (data ?? []) as unknown as DonorBadgeAwardRow[];
}

export async function countByDonorId(donorId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("donor_id", donorId);

  if (error) {
    throw new DependencyError("Failed to count badge awards for donor", error);
  }
  return count ?? 0;
}
