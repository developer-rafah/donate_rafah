/**
 * Donor profile update requests — DTOs + Zod schemas.
 *
 * Aligned to the real SQL contract:
 *   public.donor_profile_update_requests (
 *     id,
 *     donor_id,
 *     requested_by_user_id,        -- NOT NULL, FK -> users.id
 *     request_type,                -- NOT NULL
 *     current_data_json,           -- NOT NULL, jsonb snapshot of current state
 *     requested_data_json,         -- NOT NULL, jsonb proposed change
 *     status,                      -- NOT NULL, DB-defaulted (approval workflow)
 *     submitted_at,                -- NOT NULL
 *     reviewed_at,                 -- NULL until reviewed
 *     reviewed_by,                 -- NULL until reviewed
 *     review_notes,                -- NULL until reviewed
 *     created_at, updated_at
 *   )
 *
 * Donor-writable fields: `request_type`, `current_data_json`,
 * `requested_data_json`. Everything else is server- or reviewer-owned.
 */

import { z } from "@lib/validation";

export interface DonorProfileUpdateRequestDto {
  id: string;
  donorId: string;
  requestedByUserId: string;
  requestType: string;
  currentDataJson: Record<string, unknown>;
  requestedDataJson: Record<string, unknown>;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonorProfileUpdateRequestRow {
  id: string;
  donor_id: string;
  requested_by_user_id: string;
  request_type: string;
  current_data_json: Record<string, unknown> | null;
  requested_data_json: Record<string, unknown> | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toDonorProfileUpdateRequestDto(
  row: DonorProfileUpdateRequestRow
): DonorProfileUpdateRequestDto {
  return {
    id: row.id,
    donorId: row.donor_id,
    requestedByUserId: row.requested_by_user_id,
    requestType: row.request_type,
    currentDataJson: row.current_data_json ?? {},
    requestedDataJson: row.requested_data_json ?? {},
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body. `donor_id`, `requested_by_user_id`, `status`, `submitted_at`,
 * and all reviewer fields are NEVER accepted from the client — the service
 * sets them from the authenticated context or leaves them for the approval
 * workflow. `.strict()` rejects unknown keys.
 */
export const createDonorProfileUpdateRequestSchema = z
  .object({
    request_type: z.string().min(1).max(100),
    current_data_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 64, {
        message: "current_data_json has too many top-level keys (max 64)",
      }),
    requested_data_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length > 0, {
        message: "requested_data_json must not be empty",
      })
      .refine((obj) => Object.keys(obj).length <= 64, {
        message: "requested_data_json has too many top-level keys (max 64)",
      }),
  })
  .strict();

export type CreateDonorProfileUpdateRequestInput = z.infer<
  typeof createDonorProfileUpdateRequestSchema
>;
