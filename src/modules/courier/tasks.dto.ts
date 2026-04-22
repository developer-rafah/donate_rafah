/**
 * Courier field tasks — DTO.
 *
 * Aligned to `public.field_tasks`. Exposes the display-relevant subset;
 * audit columns (created_by/updated_by) are omitted.
 */

export interface CourierFieldTaskDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  donationRequestId: string;
  bookingId: string | null;
  taskNumber: string;
  taskStatusId: string | null;
  taskType: string;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourierFieldTaskRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  donation_request_id: string;
  booking_id: string | null;
  task_number: string;
  task_status_id: string | null;
  task_type: string;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toCourierFieldTaskDto(row: CourierFieldTaskRow): CourierFieldTaskDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    donationRequestId: row.donation_request_id,
    bookingId: row.booking_id,
    taskNumber: row.task_number,
    taskStatusId: row.task_status_id,
    taskType: row.task_type,
    scheduledDate: row.scheduled_date,
    scheduledStartTime: row.scheduled_start_time,
    scheduledEndTime: row.scheduled_end_time,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
