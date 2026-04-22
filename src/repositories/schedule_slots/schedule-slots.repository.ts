import "server-only";

/**
 * Schedule slots repository — read-only donor-facing catalog.
 *
 * Donor-visible subset: status = 'open'. ASSUMPTION: the schema uses the
 * string "open" for offerable slots. If a different value is used, edit
 * `DONOR_VISIBLE_STATUS` alone.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ScheduleSlotRow } from "@modules/donor/schedule-slots.dto";

const TABLE = "schedule_slots";

const DONOR_VISIBLE_STATUS = "open";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, slot_date, start_time, end_time, " +
  "capacity_limit, reserved_count, status, slot_type, " +
  "city_ref_id, district_ref_id, notes, " +
  "created_at, updated_at, created_by, updated_by";

export async function listDonorVisible(): Promise<ScheduleSlotRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("status", DONOR_VISIBLE_STATUS)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new DependencyError("Failed to list schedule slots", error);
  return (data ?? []) as unknown as ScheduleSlotRow[];
}
