/**
 * Domain — Ops / Sorting.
 *
 * Pure writable-field allowlists and constants for Phase 6. Framework-free,
 * no DB access.
 *
 * Every list below is anchored to the real schema (see the column
 * reference CSV). Server-owned fields (`organization_id`, timestamps,
 * generated ids) are never in these lists.
 */

/**
 * Fields the client may set when creating a sorting session. The session
 * binds to upstream context via `donation_request_id` + `intake_record_id`
 * — both NOT NULL in the schema; the service verifies they belong to one
 * of the caller's organizations and that the two are mutually consistent.
 */
export const OPS_SORTING_SESSION_CREATABLE_FIELDS = [
  "donation_request_id",
  "intake_record_id",
  "branch_id",
  "sorting_status",
] as const;

/**
 * Fields patchable on a sorting session. Actor-linking fields
 * (`sorted_by`, `reviewed_by`) are NOT writable by clients — they are
 * populated by the service from the authenticated context when the
 * status changes to one that requires them. This phase does NOT implement
 * that status-driven linking; the fields are simply not writable here.
 */
export const OPS_SORTING_SESSION_WRITABLE_FIELDS = [
  "sorting_status",
  "started_at",
  "completed_at",
  "reviewed_at",
  "review_notes",
  "branch_id",
] as const;

/**
 * Fields the client may set when creating a sorted item. The session
 * binding comes from the route param, not the body.
 */
export const OPS_SORTED_ITEM_CREATABLE_FIELDS = [
  "item_classification_id",
  "donation_type_ref_id",
  "donation_category_ref_id",
  "item_name",
  "item_description",
  "quantity",
  "quantity_unit_ref_id",
  "condition_assessment_id",
  "estimated_value_amount",
  "estimated_value_currency",
  "sorting_decision_id",
  "is_approved",
  "notes",
] as const;

/**
 * Patchable fields on a sorted item. Identity (`sorting_session_id`) is
 * never writable. `is_approved` stays nullable-writable here but the
 * approvals workflow belongs to a later phase.
 */
export const OPS_SORTED_ITEM_WRITABLE_FIELDS = OPS_SORTED_ITEM_CREATABLE_FIELDS;

/**
 * Fields the client may set when creating an estimated value row. The
 * service derives `sorting_session_id` from the parent sorted item (the
 * route param), so the client never supplies it.
 */
export const OPS_ESTIMATED_VALUE_CREATABLE_FIELDS = [
  "valuation_type",
  "estimated_amount",
  "currency_code",
  "valuation_notes",
  "status",
] as const;

/**
 * Fields the client may set when creating a decision-log entry. The
 * service derives `sorting_session_id` from the route param and
 * `decided_by` from the authenticated user.
 */
export const OPS_DECISION_LOG_CREATABLE_FIELDS = [
  "sorted_item_id",
  "decision_id",
  "decision_notes",
  "decided_at",
] as const;

/**
 * Fields the client may set when creating a review task.
 */
export const OPS_REVIEW_TASK_CREATABLE_FIELDS = [
  "sorting_session_id",
  "review_type",
  "assigned_to_user_id",
  "status",
  "due_at",
  "review_notes",
] as const;

/**
 * Patchable fields on a review task. The session binding is never
 * writable. `completed_at` is patchable so the client can explicitly
 * close a task; the service layer is NOT opinionated about transition
 * legality in this phase (workflow engine arrives in a later phase).
 */
export const OPS_REVIEW_TASK_WRITABLE_FIELDS = [
  "review_type",
  "assigned_to_user_id",
  "status",
  "due_at",
  "review_notes",
  "completed_at",
] as const;
