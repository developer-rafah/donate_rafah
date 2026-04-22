/**
 * Sorting sessions — DTO + Zod schemas.
 *
 * Aligned to `public.sorting_sessions`. NOT NULL in DB:
 *   organization_id, donation_request_id, intake_record_id, sorting_status,
 *   created_at, updated_at.
 *
 * `organization_id` is derived from the parent `donation_request` (same
 * org as the upstream request) — the service enforces it must be one of
 * the caller's orgs. The client never supplies organization_id directly.
 */

import { z } from "@lib/validation";

export interface SortingSessionDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  donationRequestId: string;
  intakeRecordId: string;
  sortingStatus: string;
  startedAt: string | null;
  completedAt: string | null;
  sortedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SortingSessionRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  donation_request_id: string;
  intake_record_id: string;
  sorting_status: string;
  started_at: string | null;
  completed_at: string | null;
  sorted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toSortingSessionDto(row: SortingSessionRow): SortingSessionDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    donationRequestId: row.donation_request_id,
    intakeRecordId: row.intake_record_id,
    sortingStatus: row.sorting_status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    sortedBy: row.sorted_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body. `organization_id` is derived server-side.
 */
export const createSortingSessionSchema = z
  .object({
    donation_request_id: z.string().uuid(),
    intake_record_id: z.string().uuid(),
    branch_id: z.string().uuid().optional(),
    sorting_status: z.string().min(1).max(100),
  })
  .strict();

export type CreateSortingSessionInput = z.infer<typeof createSortingSessionSchema>;

/**
 * PATCH body. `sorted_by` / `reviewed_by` are not client-writable.
 * Identity fields (donation_request_id, intake_record_id,
 * organization_id) are never writable.
 */
export const updateSortingSessionSchema = z
  .object({
    sorting_status: z.string().min(1).max(100).optional(),
    started_at: z.string().datetime().nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
    reviewed_at: z.string().datetime().nullable().optional(),
    review_notes: z.string().max(4000).nullable().optional(),
    branch_id: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one writable field must be provided",
  });

export type UpdateSortingSessionInput = z.infer<typeof updateSortingSessionSchema>;
