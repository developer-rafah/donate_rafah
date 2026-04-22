/**
 * Domain — Donor.
 *
 * Pure business rules for donor-scoped operations. Framework-free, no DB
 * access. Services call these to decide "is this write/read allowed?".
 *
 * The helpers here operate on already-fetched values (row-like objects that
 * carry a `donor_id` or `user_id`). They intentionally do NOT resolve the
 * current donor themselves — that's the service/handler's job.
 */

import type { DonorContext } from "@lib/auth/types";

/**
 * A row with a donor foreign key — any table whose ownership is keyed by
 * `donor_id` implements this shape after it's been fetched.
 */
export interface DonorOwned {
  donor_id: string;
}

/**
 * A row whose ownership is keyed by the application user id.
 */
export interface UserOwned {
  user_id: string;
}

export function isOwnedByDonor(row: DonorOwned, donor: DonorContext): boolean {
  return row.donor_id === donor.id;
}

export function isOwnedByUser(row: UserOwned, userId: string): boolean {
  return row.user_id === userId;
}

/**
 * Fields that a donor is allowed to patch on their own contact-details row.
 * Aligned to the real `public.donor_contact_details` schema. `mobile_number`
 * is NOT NULL at the DB level — still listed here so donors can *change* it
 * (not remove it); setting it to an empty string will be rejected by Zod.
 */
export const DONOR_CONTACT_DETAIL_WRITABLE_FIELDS = [
  "mobile_number",
  "secondary_mobile_number",
  "email",
  "city_ref_id",
  "district_ref_id",
  "address_line",
  "latitude",
  "longitude",
  "preferred_contact_time",
  "contact_notes",
  "is_primary",
] as const;

export type DonorContactDetailWritableField =
  (typeof DONOR_CONTACT_DETAIL_WRITABLE_FIELDS)[number];

// ---------------------------------------------------------------------------
// Phase 4 — pickup locations + donation requests
// ---------------------------------------------------------------------------

/**
 * Fields a donor is allowed to set when creating a pickup location.
 * `donor_id` and `organization_id` are NEVER in this list — donor_id comes
 * from the auth context; organization_id is derived server-side.
 */
export const DONOR_PICKUP_LOCATION_CREATABLE_FIELDS = [
  "city_ref_id",
  "district_ref_id",
  "address_line",
  "landmark",
  "building_type_ref_id",
  "floor_number",
  "has_elevator",
  "parking_notes",
  "latitude",
  "longitude",
  "is_default",
] as const;

/**
 * Fields a donor is allowed to patch on their own pickup location.
 * Mirrors the creatable list; excludes any identity FKs and audit fields.
 */
export const DONOR_PICKUP_LOCATION_WRITABLE_FIELDS = [
  "city_ref_id",
  "district_ref_id",
  "address_line",
  "landmark",
  "building_type_ref_id",
  "floor_number",
  "has_elevator",
  "parking_notes",
  "latitude",
  "longitude",
  "is_default",
] as const;

/**
 * Fields a donor is allowed to set when creating a donation request.
 *
 * Explicitly EXCLUDED (these belong to the server or a later phase):
 *   donor_id              — from context
 *   organization_id       — derived or later-phase
 *   branch_id             — derived or later-phase
 *   request_number        — DB or server assigns
 *   current_status_id     — server assigns via initial-status lookup
 *   priority_level        — internal assignment service
 *   cancellation_reason_ref_id — cancellation only (not in this phase)
 *   submitted_at / closed_at / cancelled_at — lifecycle transitions
 *   created_by / updated_by — audit triggers
 */
export const DONOR_DONATION_REQUEST_CREATABLE_FIELDS = [
  "pickup_location_id",
  "donation_type_ref_id",
  "donation_category_ref_id",
  "summary_description",
  "estimated_quantity_text",
  "donor_notes",
] as const;

/**
 * Fields a donor is allowed to set when adding a detail line to one of
 * their own requests. Aligned to the real donation_request_details shape.
 */
export const DONOR_DONATION_REQUEST_DETAIL_CREATABLE_FIELDS = [
  "donor_input_json",
  "photos_count",
  "has_fragile_items",
  "has_heavy_items",
  "requires_special_handling",
  "additional_notes",
] as const;

/**
 * Fixed source channel for requests created through the donor-facing API in
 * this phase. If the DB enforces an enum with a different allowed value,
 * change this single constant.
 */
export const DONOR_REQUEST_SOURCE_CHANNEL = "donor_web";

/**
 * Code of the status a freshly-created donor request should be placed in.
 * Resolved against `public.request_statuses.code`; the repository falls back
 * to `is_initial = true` if the code is not found, and surfaces a clear
 * error if neither exists.
 */
export const DONOR_REQUEST_INITIAL_STATUS_CODE = "draft";
