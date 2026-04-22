import "server-only";

/**
 * Sorting review tasks repository.
 *
 * Scoped via parent `sorting_session_id`. Because `sorting_review_tasks`
 * does not carry `organization_id` directly, all filtering happens
 * through the set of session ids the caller is allowed to see — the
 * service resolves that list before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError, NotFoundError } from "@lib/errors";
import type { ReviewTaskRow } from "@modules/ops/review-tasks.dto";

const TABLE = "sorting_review_tasks";

const SELECT_COLUMNS =
  "id, sorting_session_id, review_type, assigned_to_user_id, status, " +
  "due_at, review_notes, completed_at, created_at, updated_at";

export async function listInSessions(sessionIds: string[]): Promise<ReviewTaskRow[]> {
  if (sessionIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("sorting_session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list review tasks", error);
  return (data ?? []) as unknown as ReviewTaskRow[];
}

export async function findByIdInSessions(
  id: string,
  sessionIds: string[]
): Promise<ReviewTaskRow | null> {
  if (sessionIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("sorting_session_id", sessionIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load review task", error);
  return (data as unknown as ReviewTaskRow) ?? null;
}

export interface CreateReviewTaskDbInput {
  sorting_session_id: string;
  review_type: string;
  assigned_to_user_id: string | null;
  status: string;
  due_at: string | null;
  review_notes: string | null;
}

export async function create(input: CreateReviewTaskDbInput): Promise<ReviewTaskRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create review task", error);
  return data as unknown as ReviewTaskRow;
}

export type ReviewTaskPatch = Partial<
  Pick<
    ReviewTaskRow,
    | "review_type"
    | "assigned_to_user_id"
    | "status"
    | "due_at"
    | "review_notes"
    | "completed_at"
  >
>;

export async function updateByIdInSessions(
  id: string,
  sessionIds: string[],
  patch: ReviewTaskPatch
): Promise<ReviewTaskRow> {
  if (sessionIds.length === 0) {
    throw new NotFoundError("Review task not found");
  }
  const supabase = await createSupabaseServerClient();

  const safe: Record<string, unknown> = {};
  if (patch.review_type !== undefined) safe.review_type = patch.review_type;
  if (patch.assigned_to_user_id !== undefined)
    safe.assigned_to_user_id = patch.assigned_to_user_id;
  if (patch.status !== undefined) safe.status = patch.status;
  if (patch.due_at !== undefined) safe.due_at = patch.due_at;
  if (patch.review_notes !== undefined) safe.review_notes = patch.review_notes;
  if (patch.completed_at !== undefined) safe.completed_at = patch.completed_at;

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("id", id)
    .in("sorting_session_id", sessionIds)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to update review task", error);
  if (!data) throw new NotFoundError("Review task not found");
  return data as unknown as ReviewTaskRow;
}
