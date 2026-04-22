import "server-only";

/**
 * Sorting sessions repository.
 *
 * All reads/writes are org-scoped via a `.in("organization_id", orgIds)`
 * filter — the service passes the caller's membership org set. This
 * means a row in another organization simply does not exist from the
 * caller's perspective (NotFound, not Forbidden), matching the pattern
 * used elsewhere (donor/courier) to avoid existence leaks.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError, NotFoundError } from "@lib/errors";
import type { SortingSessionRow } from "@modules/ops/sorting-sessions.dto";

const TABLE = "sorting_sessions";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, donation_request_id, intake_record_id, " +
  "sorting_status, started_at, completed_at, sorted_by, reviewed_by, " +
  "reviewed_at, review_notes, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<SortingSessionRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list sorting sessions", error);
  return (data ?? []) as unknown as SortingSessionRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<SortingSessionRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load sorting session", error);
  return (data as unknown as SortingSessionRow) ?? null;
}

/**
 * Full NOT-NULL-safe insert payload. Identity (`organization_id`) is
 * derived by the service from the parent donation_request.
 */
export interface CreateSortingSessionDbInput {
  organization_id: string;
  branch_id: string | null;
  donation_request_id: string;
  intake_record_id: string;
  sorting_status: string;
}

export async function create(
  input: CreateSortingSessionDbInput
): Promise<SortingSessionRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create sorting session", error);
  return data as unknown as SortingSessionRow;
}

export type SortingSessionPatch = Partial<
  Pick<
    SortingSessionRow,
    | "sorting_status"
    | "started_at"
    | "completed_at"
    | "reviewed_at"
    | "review_notes"
    | "branch_id"
  >
>;

/**
 * Update a sorting session, gated by org scope so a foreign-org id maps
 * to NotFound rather than mutating another org's row.
 */
export async function updateByIdInOrgs(
  id: string,
  orgIds: string[],
  patch: SortingSessionPatch
): Promise<SortingSessionRow> {
  if (orgIds.length === 0) {
    throw new NotFoundError("Sorting session not found");
  }
  const supabase = await createSupabaseServerClient();

  const safe: Record<string, unknown> = {};
  if (patch.sorting_status !== undefined) safe.sorting_status = patch.sorting_status;
  if (patch.started_at !== undefined) safe.started_at = patch.started_at;
  if (patch.completed_at !== undefined) safe.completed_at = patch.completed_at;
  if (patch.reviewed_at !== undefined) safe.reviewed_at = patch.reviewed_at;
  if (patch.review_notes !== undefined) safe.review_notes = patch.review_notes;
  if (patch.branch_id !== undefined) safe.branch_id = patch.branch_id;

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("id", id)
    .in("organization_id", orgIds)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to update sorting session", error);
  if (!data) throw new NotFoundError("Sorting session not found");
  return data as unknown as SortingSessionRow;
}
