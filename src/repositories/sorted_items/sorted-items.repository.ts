import "server-only";

/**
 * Sorted items repository.
 *
 * Scoped by parent `sorting_session_id` — the service resolves session
 * ownership (org-scoped) before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError, NotFoundError } from "@lib/errors";
import type { SortedItemRow } from "@modules/ops/sorted-items.dto";

const TABLE = "sorted_items";

const SELECT_COLUMNS =
  "id, sorting_session_id, item_classification_id, donation_type_ref_id, " +
  "donation_category_ref_id, item_name, item_description, quantity, " +
  "quantity_unit_ref_id, condition_assessment_id, estimated_value_amount, " +
  "estimated_value_currency, sorting_decision_id, is_approved, notes, " +
  "created_at, updated_at";

export async function listBySessionId(sessionId: string): Promise<SortedItemRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("sorting_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new DependencyError("Failed to list sorted items", error);
  return (data ?? []) as unknown as SortedItemRow[];
}

/**
 * Find a sorted item whose parent session belongs to one of the caller's
 * org-scoped session ids. The caller resolves `sessionIds` via a prior
 * org-scoped session lookup.
 */
export async function findByIdInSessions(
  id: string,
  sessionIds: string[]
): Promise<SortedItemRow | null> {
  if (sessionIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("sorting_session_id", sessionIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load sorted item", error);
  return (data as unknown as SortedItemRow) ?? null;
}

export interface CreateSortedItemDbInput {
  sorting_session_id: string;
  item_classification_id: string | null;
  donation_type_ref_id: string | null;
  donation_category_ref_id: string | null;
  item_name: string;
  item_description: string | null;
  quantity: number;
  quantity_unit_ref_id: string | null;
  condition_assessment_id: string | null;
  estimated_value_amount: string | number | null;
  estimated_value_currency: string | null;
  sorting_decision_id: string | null;
  is_approved: boolean;
  notes: string | null;
  created_by: string | null;
}

export async function create(input: CreateSortedItemDbInput): Promise<SortedItemRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create sorted item", error);
  return data as unknown as SortedItemRow;
}

export type SortedItemPatch = Partial<
  Omit<
    CreateSortedItemDbInput,
    "sorting_session_id" | "created_by"
  >
> & {
  updated_by?: string | null;
};

/**
 * Update a sorted item, gated by the caller's org-scoped session id set
 * so a foreign row can't be touched via its id alone.
 */
export async function updateByIdInSessions(
  id: string,
  sessionIds: string[],
  patch: SortedItemPatch
): Promise<SortedItemRow> {
  if (sessionIds.length === 0) {
    throw new NotFoundError("Sorted item not found");
  }
  const supabase = await createSupabaseServerClient();

  const safe: Record<string, unknown> = {};
  const allow: Array<keyof SortedItemPatch> = [
    "item_classification_id",
    "donation_type_ref_id",
    "donation_category_ref_id",
    "item_name",
    "item_description",
    "quantity",
    "quantity_unit_ref_id",
    "condition_assessment_id",
    "estimated_value_amount",
    "estimated_value_currency",
    "sorting_decision_id",
    "is_approved",
    "notes",
    "updated_by",
  ];
  for (const key of allow) {
    if (patch[key] !== undefined) safe[key] = patch[key];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("id", id)
    .in("sorting_session_id", sessionIds)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to update sorted item", error);
  if (!data) throw new NotFoundError("Sorted item not found");
  return data as unknown as SortedItemRow;
}
