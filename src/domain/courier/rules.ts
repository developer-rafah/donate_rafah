/**
 * Domain — Courier.
 *
 * Pure business rules and allowlists for courier-scoped operations.
 * Framework-free, no DB access.
 */

/**
 * Fields a courier may set when creating a field update for a task they own.
 * Server-controlled fields (field_task_id, courier_id, created_by,
 * created_at) are set by the service from context.
 */
export const COURIER_FIELD_UPDATE_CREATABLE_FIELDS = [
  "update_type",
  "status_id",
  "title",
  "notes",
  "location_latitude",
  "location_longitude",
  "happened_at",
] as const;

/**
 * Fields a courier may set when creating a field proof row. Attachment
 * upload is out of scope — the client provides the id of an already-uploaded
 * `public.attachments` row.
 */
export const COURIER_FIELD_PROOF_CREATABLE_FIELDS = [
  "proof_type",
  "attachment_id",
  "field_update_id",
  "notes",
  "captured_at",
] as const;

/**
 * Fields a courier may set when creating an intake record.
 * `organization_id`, `donation_request_id`, `field_task_id`, `courier_id`
 * are all sourced by the service (context or the parent task).
 */
export const COURIER_INTAKE_CREATABLE_FIELDS = [
  "intake_status",
  "pickup_completed_at",
  "received_quantity_text",
  "courier_notes",
  "recipient_confirmation_method",
  "requires_sorting",
] as const;

/**
 * Fields a courier may patch on an intake record they own. Same set as
 * creatable for this phase — we treat intake as a simple mutable record
 * until approval/sorting workflows land.
 */
export const COURIER_INTAKE_WRITABLE_FIELDS = COURIER_INTAKE_CREATABLE_FIELDS;

/**
 * An assignment is "active" (i.e. the courier effectively owns the task)
 * when neither the rejected_at nor unassigned_at timestamps are set.
 *
 * ASSUMPTION: the schema has no visible `assignment_statuses.code` enum in
 * the CSV reference, so we rely on the timestamp columns rather than a
 * status-code comparison. If the organization uses code-based status
 * ("assigned", "accepted") instead of timestamps as the source of truth,
 * this predicate should be replaced — a single repository change.
 */
export function isAssignmentActive(row: {
  rejected_at: string | null;
  unassigned_at: string | null;
}): boolean {
  return row.rejected_at === null && row.unassigned_at === null;
}
