import "server-only";

/**
 * Assignments repository — courier-scoped reads.
 *
 * Active-ownership semantics: `rejected_at IS NULL AND unassigned_at IS
 * NULL`. See `@domain/courier/rules.isAssignmentActive` for the same rule
 * as a predicate on fetched rows.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CourierAssignmentRow } from "@modules/courier/assignments.dto";

const TABLE = "assignments";

const SELECT_COLUMNS =
  "id, field_task_id, courier_id, assignment_status_id, " +
  "assigned_at, accepted_at, rejected_at, unassigned_at, " +
  "assigned_by, assignment_method, assignment_notes, " +
  "created_at, updated_at";

export async function listByCourierId(
  courierId: string
): Promise<CourierAssignmentRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("courier_id", courierId)
    .order("assigned_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list courier assignments", error);
  return (data ?? []) as unknown as CourierAssignmentRow[];
}

/**
 * Count currently-active assignments for a courier. "Active" = neither
 * rejected_at nor unassigned_at populated.
 */
export async function countActiveByCourierId(courierId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("courier_id", courierId)
    .is("rejected_at", null)
    .is("unassigned_at", null);

  if (error) throw new DependencyError("Failed to count active assignments", error);
  return count ?? 0;
}

/**
 * Look up a single active assignment tying this courier to this task.
 * Returns null if no such active row exists — caller interprets that as
 * "task not owned by caller" and typically maps to NotFound.
 */
export async function findActiveAssignmentForCourierAndTask(
  courierId: string,
  fieldTaskId: string
): Promise<CourierAssignmentRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("courier_id", courierId)
    .eq("field_task_id", fieldTaskId)
    .is("rejected_at", null)
    .is("unassigned_at", null)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load active assignment", error);
  }
  return (data as unknown as CourierAssignmentRow) ?? null;
}

/**
 * Return the set of field_task_ids the courier currently has active
 * assignments for. Used to drive the tasks list without a separate join.
 */
export async function listActiveTaskIdsForCourier(
  courierId: string
): Promise<string[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("field_task_id")
    .eq("courier_id", courierId)
    .is("rejected_at", null)
    .is("unassigned_at", null);

  if (error) {
    throw new DependencyError("Failed to list active task ids for courier", error);
  }
  const rows = (data ?? []) as Array<{ field_task_id: string }>;
  // De-duplicate in case multiple active rows point at the same task.
  return Array.from(new Set(rows.map((r) => r.field_task_id)));
}
