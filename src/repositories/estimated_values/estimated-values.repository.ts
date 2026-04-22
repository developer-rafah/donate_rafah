import "server-only";

/**
 * Estimated values repository.
 *
 * Scoped by parent `sorted_item_id`. The service verifies the sorted
 * item belongs to the caller's org set before reads/writes.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { EstimatedValueRow } from "@modules/ops/estimated-values.dto";

const TABLE = "estimated_values";

const SELECT_COLUMNS =
  "id, sorting_session_id, sorted_item_id, valuation_type, estimated_amount, " +
  "currency_code, valuation_notes, valued_by, approved_by, approved_at, " +
  "status, created_at, updated_at";

export async function listBySortedItemId(
  sortedItemId: string
): Promise<EstimatedValueRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("sorted_item_id", sortedItemId)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list estimated values", error);
  return (data ?? []) as unknown as EstimatedValueRow[];
}

export interface CreateEstimatedValueDbInput {
  sorting_session_id: string;
  sorted_item_id: string;
  valuation_type: string;
  estimated_amount: string | number;
  currency_code: string;
  valuation_notes: string | null;
  valued_by: string | null;
  status: string;
}

export async function create(
  input: CreateEstimatedValueDbInput
): Promise<EstimatedValueRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create estimated value", error);
  return data as unknown as EstimatedValueRow;
}
