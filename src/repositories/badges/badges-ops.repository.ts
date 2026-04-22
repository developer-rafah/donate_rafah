import "server-only";

/**
 * Badges — ops-side reads (both `badges` and `badge_awards`).
 *
 * Sibling of `badges.repository.ts` (donor-facing) to keep the two
 * callers decoupled. Org-scoped reads on `badges`; donor-scoped reads
 * on `badge_awards` with org verification happening in the service
 * layer.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type {
  OpsBadgeAwardRow,
  OpsBadgeRow,
} from "@modules/recognition/badges.dto";

const BADGES_TABLE = "badges";
const AWARDS_TABLE = "badge_awards";

const BADGE_COLUMNS =
  "id, organization_id, badge_code, name_ar, name_en, description, " +
  "icon_file_path, badge_level, criteria_payload_json, is_active, is_public, " +
  "created_at, updated_at";

const AWARD_COLUMNS =
  "id, organization_id, badge_id, donor_id, award_reason, " +
  "award_source_entity_type, award_source_entity_id, " +
  "awarded_at, awarded_by, created_at";

// ---- Badges -----------------------------------------------------------------

export async function listInOrgs(orgIds: string[]): Promise<OpsBadgeRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(BADGES_TABLE)
    .select(BADGE_COLUMNS)
    .in("organization_id", orgIds)
    .order("badge_level", { ascending: true });

  if (error) throw new DependencyError("Failed to list badges", error);
  return (data ?? []) as unknown as OpsBadgeRow[];
}

export async function findBadgeByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<OpsBadgeRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(BADGES_TABLE)
    .select(BADGE_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load badge", error);
  return (data as unknown as OpsBadgeRow) ?? null;
}

// ---- Awards -----------------------------------------------------------------

export async function listAwardsByDonorId(
  donorId: string
): Promise<OpsBadgeAwardRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(AWARDS_TABLE)
    .select(AWARD_COLUMNS)
    .eq("donor_id", donorId)
    .order("awarded_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list donor badges", error);
  return (data ?? []) as unknown as OpsBadgeAwardRow[];
}

/**
 * Check whether an award already exists for a (badge, donor) pair.
 * Used to enforce one-per-donor-per-badge at the app layer — no DB
 * unique constraint visible in the CSV.
 */
export async function findAwardForBadgeAndDonor(
  badgeId: string,
  donorId: string
): Promise<OpsBadgeAwardRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(AWARDS_TABLE)
    .select(AWARD_COLUMNS)
    .eq("badge_id", badgeId)
    .eq("donor_id", donorId)
    .limit(1)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to check existing badge award", error);
  return (data as unknown as OpsBadgeAwardRow) ?? null;
}

export interface CreateBadgeAwardDbInput {
  organization_id: string;
  badge_id: string;
  donor_id: string;
  award_reason: string | null;
  award_source_entity_type: string | null;
  award_source_entity_id: string | null;
  awarded_at: string;
  awarded_by: string | null;
}

export async function createAward(
  input: CreateBadgeAwardDbInput
): Promise<OpsBadgeAwardRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(AWARDS_TABLE)
    .insert(input)
    .select(AWARD_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create badge award", error);
  return data as unknown as OpsBadgeAwardRow;
}
