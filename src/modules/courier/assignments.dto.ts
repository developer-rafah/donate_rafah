/**
 * Courier assignments — DTO.
 *
 * Aligned to `public.assignments`. Audit fields are omitted from the
 * donor/courier-facing output (`created_at`/`updated_at` kept for display;
 * `assigned_by` kept as an id — no user lookup in this phase).
 */

export interface CourierAssignmentDto {
  id: string;
  fieldTaskId: string;
  courierId: string;
  assignmentStatusId: string | null;
  assignedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  unassignedAt: string | null;
  assignedBy: string | null;
  assignmentMethod: string;
  assignmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourierAssignmentRow {
  id: string;
  field_task_id: string;
  courier_id: string;
  assignment_status_id: string | null;
  assigned_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  unassigned_at: string | null;
  assigned_by: string | null;
  assignment_method: string;
  assignment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toCourierAssignmentDto(row: CourierAssignmentRow): CourierAssignmentDto {
  return {
    id: row.id,
    fieldTaskId: row.field_task_id,
    courierId: row.courier_id,
    assignmentStatusId: row.assignment_status_id,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    unassignedAt: row.unassigned_at,
    assignedBy: row.assigned_by,
    assignmentMethod: row.assignment_method,
    assignmentNotes: row.assignment_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
