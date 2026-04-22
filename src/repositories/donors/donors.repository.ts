import "server-only";

/**
 * Donors repository.
 *
 * Reads against `public.donors`.
 *
 * Real schema (from the canonical CSV reference):
 *   - id              uuid  PK
 *   - organization_id uuid  NOT NULL  FK -> organizations.id
 *   - user_id         uuid  NOT NULL  FK -> users.id        (UNIQUE)
 *   - branch_id       uuid  NULL      FK -> branches.id
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorContext } from "@lib/auth/types";

const DONORS_TABLE = "donors";

export async function findDonorByUserId(userId: string): Promise<DonorContext | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(DONORS_TABLE)
    .select("id, user_id, organization_id, branch_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load donor by user id", error);
  }
  if (!data) return null;

  const row = data as {
    id: string;
    user_id: string;
    organization_id: string;
    branch_id: string | null;
  };
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
  };
}

/**
 * Read the canonical `total_points` counter directly off the donor row.
 * `public.donors.total_points` is NOT NULL and is maintained by the DB /
 * upstream business logic — the donor API doesn't need to re-aggregate
 * the ledger.
 */
export async function findTotalPoints(donorId: string): Promise<number> {
  const counters = await findCounters(donorId);
  return counters.totalPoints;
}

/**
 * Read the maintained counters from `public.donors`. Both columns are
 * NOT NULL in the schema; the DB/upstream keeps them accurate.
 */
export async function findCounters(
  donorId: string
): Promise<{ totalPoints: number; totalDonationsCount: number }> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(DONORS_TABLE)
    .select("total_points, total_donations_count")
    .eq("id", donorId)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to read donor counters", error);
  }
  if (!data) return { totalPoints: 0, totalDonationsCount: 0 };

  const row = data as { total_points: number; total_donations_count: number };
  return {
    totalPoints: row.total_points ?? 0,
    totalDonationsCount: row.total_donations_count ?? 0,
  };
}

/**
 * Donor scope row used by ops recognition flows — only the org + id
 * needed to verify caller-visibility before awarding points / badges /
 * issuing certificates.
 */
export interface DonorScopeRow {
  id: string;
  organization_id: string;
  total_points: number;
}

export async function findScopeById(id: string): Promise<DonorScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(DONORS_TABLE)
    .select("id, organization_id, total_points")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load donor scope", error);
  return (data as unknown as DonorScopeRow) ?? null;
}

/**
 * Set `donors.total_points` to an explicit value. Called by the points
 * service after appending a ledger row so the canonical counter stays
 * aligned with ledger balance_after. No transaction boundary with the
 * ledger insert — the race window is narrow and the recognition phase
 * treats points as best-effort.
 */
export async function setTotalPoints(donorId: string, value: number): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from(DONORS_TABLE)
    .update({ total_points: value })
    .eq("id", donorId);

  if (error) throw new DependencyError("Failed to update donor total_points", error);
}
