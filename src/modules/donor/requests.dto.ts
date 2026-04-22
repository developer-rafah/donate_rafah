/**
 * Donation requests — DTOs + Zod schemas.
 *
 * Aligned to the real SQL contract:
 *   public.donation_requests (
 *     id, organization_id, branch_id, donor_id, request_number,
 *     donation_type_ref_id, donation_category_ref_id, pickup_location_id,
 *     current_status_id, priority_level,
 *     summary_description, estimated_quantity_text, donor_notes,
 *     source_channel,
 *     submitted_at, closed_at, cancelled_at, cancellation_reason_ref_id,
 *     created_at, updated_at, created_by, updated_by
 *   )
 *
 * Creation is deliberately narrow: see
 * `DONOR_DONATION_REQUEST_CREATABLE_FIELDS` for the source of truth.
 * Donors never set `priority_level` or `cancellation_reason_ref_id` —
 * the former is assigned internally, the latter only during cancellation
 * (not in this phase).
 */

import { z } from "@lib/validation";

export interface DonationRequestDto {
  id: string;
  organizationId: string | null;
  branchId: string | null;
  donorId: string;
  requestNumber: string | null;
  donationTypeRefId: string | null;
  donationCategoryRefId: string | null;
  pickupLocationId: string | null;
  currentStatusId: string | null;
  priorityLevel: string | null;
  summaryDescription: string;
  estimatedQuantityText: string | null;
  donorNotes: string | null;
  sourceChannel: string | null;
  submittedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancellationReasonRefId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DonationRequestRow {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  donor_id: string;
  request_number: string | null;
  donation_type_ref_id: string | null;
  donation_category_ref_id: string | null;
  pickup_location_id: string | null;
  current_status_id: string | null;
  priority_level: string | null;
  summary_description: string;
  estimated_quantity_text: string | null;
  donor_notes: string | null;
  source_channel: string | null;
  submitted_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason_ref_id: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export function toDonationRequestDto(row: DonationRequestRow): DonationRequestDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    donorId: row.donor_id,
    requestNumber: row.request_number,
    donationTypeRefId: row.donation_type_ref_id,
    donationCategoryRefId: row.donation_category_ref_id,
    pickupLocationId: row.pickup_location_id,
    currentStatusId: row.current_status_id,
    priorityLevel: row.priority_level,
    summaryDescription: row.summary_description,
    estimatedQuantityText: row.estimated_quantity_text,
    donorNotes: row.donor_notes,
    sourceChannel: row.source_channel,
    submittedAt: row.submitted_at,
    closedAt: row.closed_at,
    cancelledAt: row.cancelled_at,
    cancellationReasonRefId: row.cancellation_reason_ref_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Donor-facing creation body. Every server-owned field is absent by design.
 * `.strict()` rejects any client attempt to spoof `donor_id`,
 * `current_status_id`, `request_number`, `priority_level`, etc.
 *
 * `pickup_location_id` is REQUIRED here because
 * `public.donation_requests.pickup_location_id` is NOT NULL in the schema.
 * `summary_description` is nullable in the schema but kept required on the
 * wire for product sanity — a request with no description is not useful.
 */
export const createDonationRequestSchema = z
  .object({
    pickup_location_id: z.string().uuid(),
    donation_type_ref_id: z.string().uuid().optional(),
    donation_category_ref_id: z.string().uuid().optional(),
    summary_description: z.string().min(1).max(4000),
    estimated_quantity_text: z.string().max(500).optional(),
    donor_notes: z.string().max(4000).optional(),
  })
  .strict();

export type CreateDonationRequestInput = z.infer<typeof createDonationRequestSchema>;
