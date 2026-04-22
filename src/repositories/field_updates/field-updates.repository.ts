import "server-only";

/**
 * Field updates repository.
 *
 * Ownership is enforced by the service layer before these functions run —
 * the repo trusts the caller has already confirmed the task belongs to the
 * courier via an active assignment.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CourierFieldUpdateRow } from "@modules/courier/field-updates.dto";

const TABLE = "field_updates";

const SELECT_COLUMNS =
  "id, field_task_id, courier_id, update_type, status_id, title, notes, " +
  "location_latitude, location_longitude, happened_at, created_at, created_by";

export async function listByTaskId(fieldTaskId: string): Promise<CourierFieldUpdateRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("field_task_id", fieldTaskId)
    .order("happened_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list field updates", error);
  return (data ?? []) as unknown as CourierFieldUpdateRow[];
}

/**
 * Full insert payload. NOT-NULL fields (`field_task_id`, `courier_id`,
 * `update_type`, `happened_at`) are required; everything else is nullable.
 */
export interface CreateFieldUpdateDbInput {
  field_task_id: string;
  courier_id: string;
  update_type: string;
  status_id: string | null;
  title: string | null;
  notes: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  happened_at: string;
  created_by: string | null;
}

export async function create(
  input: CreateFieldUpdateDbInput
): Promise<CourierFieldUpdateRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create field update", error);
  return data as unknown as CourierFieldUpdateRow;
}
