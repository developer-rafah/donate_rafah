import "server-only";

/**
 * Points ledger — ops-side reads + append-only create.
 *
 * Kept separate from `points.repository.ts` because that file uses the
 * donor-facing row shape (narrower columns for the donor view). This
 * file operates on the full `points_ledger` row for internal ops.
 *
 * Org-scoped via `.in("organization_id", orgIds)`. Writes are
 * append-only — no UPDATE/DELETE exposed.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { OpsPointsLedgerRow } from "@modules/recognition/points.dto";

const TABLE = "points_ledger";

const SELECT_COLUMNS =
  "id, organization_id, donor_id, rule_id, source_entity_type, source_entity_id, " +
  "points_delta, balance_after, ledger_type, notes, awarded_at, " +
  "created_at, created_by";

export async function listInOrgs(orgIds: string[]): Promise<OpsPointsLedgerRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("awarded_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list points ledger", error);
  return (data ?? []) as unknown as OpsPointsLedgerRow[];
}

export async function listByDonorId(donorId: string): Promise<OpsPointsLedgerRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donor_id", donorId)
    .order("awarded_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list donor points ledger", error);
  return (data ?? []) as unknown as OpsPointsLedgerRow[];
}

/**
 * Count prior awards for a (donor, rule) pair. Used to enforce
 * `points_rules.max_repeat_count` at the app layer.
 */
export async function countAwardsForDonorAndRule(
  donorId: string,
  ruleId: string
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("donor_id", donorId)
    .eq("rule_id", ruleId);

  if (error) {
    throw new DependencyError("Failed to count prior awards for rule", error);
  }
  return count ?? 0;
}

/**
 * Full NOT-NULL-safe insert payload for the ledger.
 */
export interface CreateLedgerEntryDbInput {
  organization_id: string;
  donor_id: string;
  rule_id: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  points_delta: number;
  balance_after: number;
  ledger_type: string;
  notes: string | null;
  awarded_at: string;
  created_by: string | null;
}

export async function create(
  input: CreateLedgerEntryDbInput
): Promise<OpsPointsLedgerRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create ledger entry", error);
  return data as unknown as OpsPointsLedgerRow;
}
