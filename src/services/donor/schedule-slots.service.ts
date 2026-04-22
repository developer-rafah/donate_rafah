import "server-only";

/**
 * Donor schedule slots service — read-only catalog.
 */

import * as repo from "@repositories/schedule_slots/schedule-slots.repository";
import {
  toScheduleSlotDto,
  type ScheduleSlotDto,
} from "@modules/donor/schedule-slots.dto";

export async function listActiveScheduleSlots(): Promise<ScheduleSlotDto[]> {
  const rows = await repo.listDonorVisible();
  return rows.map(toScheduleSlotDto);
}
