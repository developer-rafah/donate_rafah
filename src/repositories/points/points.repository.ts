import "server-only";

/**
 * Points ledger repository — donor-scoped reads.
 *
 * Real schema:
 *   public.points_ledger (
 *     id, organization_id, donor_id, rule_id,
 *     source_entity_type, source_entity_id,
 *     points_delta, balance_after, ledger_type,
 *     notes, awarded_at, created_at, created_by
 *   )
 *
 * Totals are NOT computed here. The canonical running total lives in
 * `public.donors.total_points` (NOT NULL) and is maintained by the DB /
 * upstream business logic. See `donors.repository.ts::findTotalPoints`.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorPointsLedgerRow } from "@modules/donor/recognition.dto";

const TABLE = "points_ledger";

const SELECT_COLUMNS =
  "id, donor_id, points_delta, balance_after, ledger_type, notes, awarded_at";

export async function listByDonorId(donorId: string): Promise<DonorPointsLedgerRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donor_id", donorId)
    .order("awarded_at", { ascending: false });

  if (error) {
    throw new DependencyError("Failed to list points ledger for donor", error);
  }
  return (data ?? []) as unknown as DonorPointsLedgerRow[];
}
