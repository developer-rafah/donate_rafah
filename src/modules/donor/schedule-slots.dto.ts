/**
 * Schedule slots — read-only donor-facing catalog.
 *
 * Aligned to the real SQL contract:
 *   public.schedule_slots (
 *     id,
 *     organization_id,
 *     branch_id,
 *     slot_date,
 *     start_time,
 *     end_time,
 *     capacity_limit,
 *     reserved_count,
 *     status,
 *     slot_type,
 *     city_ref_id,
 *     district_ref_id,
 *     notes,
 *     created_at,
 *     updated_at,
 *     created_by,
 *     updated_by
 *   )
 *
 * Donors see an active subset only. `notes`, `created_by`, `updated_by`
 * are omitted from the DTO — internal operational metadata.
 *
 * ASSUMPTION: `status = 'open'` is the value exposed to donors. If the
 * status taxonomy uses a different code ("available" / "active" / enum
 * value), update the constant in the repository alone.
 */

export interface ScheduleSlotDto {
  id: string;
  organizationId: string | null;
  branchId: string | null;
  slotDate: string;          // ISO date (YYYY-MM-DD)
  startTime: string;         // HH:MM:SS
  endTime: string;           // HH:MM:SS
  capacityLimit: number | null;
  reservedCount: number | null;
  status: string;
  slotType: string | null;
  cityRefId: string | null;
  districtRefId: string | null;
}

export interface ScheduleSlotRow {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity_limit: number | null;
  reserved_count: number | null;
  status: string;
  slot_type: string | null;
  city_ref_id: string | null;
  district_ref_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export function toScheduleSlotDto(row: ScheduleSlotRow): ScheduleSlotDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    slotDate: row.slot_date,
    startTime: row.start_time,
    endTime: row.end_time,
    capacityLimit: row.capacity_limit,
    reservedCount: row.reserved_count,
    status: row.status,
    slotType: row.slot_type,
    cityRefId: row.city_ref_id,
    districtRefId: row.district_ref_id,
  };
}
