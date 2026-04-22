import "server-only";

/**
 * Field tasks repository.
 *
 * Tasks are not directly courier-scoped — ownership is via `assignments`.
 * The courier service provides the list of owned task ids and this repo
 * reads them in bulk.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CourierFieldTaskRow } from "@modules/courier/tasks.dto";

const TABLE = "field_tasks";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, donation_request_id, booking_id, " +
  "task_number, task_status_id, task_type, " +
  "scheduled_date, scheduled_start_time, scheduled_end_time, " +
  "started_at, completed_at, cancelled_at, notes, " +
  "created_at, updated_at";

export async function listByIds(ids: string[]): Promise<CourierFieldTaskRow[]> {
  if (ids.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("id", ids)
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  if (error) throw new DependencyError("Failed to list field tasks", error);
  return (data ?? []) as unknown as CourierFieldTaskRow[];
}

export async function findById(id: string): Promise<CourierFieldTaskRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load field task", error);
  return (data as unknown as CourierFieldTaskRow) ?? null;
}

/**
 * Count "open" tasks within a given id set.
 *
 * ASSUMPTION: a task is "open" when neither `completed_at` nor
 * `cancelled_at` is set. If the organization uses `task_status_id` with
 * a terminal flag instead, replace this predicate — single-file change.
 */
export async function countOpenByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .in("id", ids)
    .is("completed_at", null)
    .is("cancelled_at", null);

  if (error) throw new DependencyError("Failed to count open tasks", error);
  return count ?? 0;
}
