/**
 * Donation request details — DTOs + Zod schemas.
 *
 * Aligned to the real SQL contract:
 *   public.donation_request_details (
 *     id,
 *     donation_request_id,
 *     donor_input_json,
 *     photos_count,
 *     has_fragile_items,
 *     has_heavy_items,
 *     requires_special_handling,
 *     additional_notes,
 *     created_at,
 *     updated_at
 *   )
 *
 * `donor_input_json` is the free-form structured blob the donor submits
 * (items, quantities, units, descriptions — whatever the client app models).
 * The shape is owned by the client contract; this backend validates it as
 * a plain JSON object with a sensible key limit.
 *
 * Sorting, condition assessments and estimated values live in separate
 * tables and are NOT surfaced through this donor-facing endpoint.
 */

import { z } from "@lib/validation";

export interface DonationRequestDetailDto {
  id: string;
  donationRequestId: string;
  donorInputJson: Record<string, unknown>;
  photosCount: number | null;
  hasFragileItems: boolean | null;
  hasHeavyItems: boolean | null;
  requiresSpecialHandling: boolean | null;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DonationRequestDetailRow {
  id: string;
  donation_request_id: string;
  donor_input_json: Record<string, unknown> | null;
  photos_count: number | null;
  has_fragile_items: boolean | null;
  has_heavy_items: boolean | null;
  requires_special_handling: boolean | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export function toDonationRequestDetailDto(
  row: DonationRequestDetailRow
): DonationRequestDetailDto {
  return {
    id: row.id,
    donationRequestId: row.donation_request_id,
    donorInputJson: row.donor_input_json ?? {},
    photosCount: row.photos_count,
    hasFragileItems: row.has_fragile_items,
    hasHeavyItems: row.has_heavy_items,
    requiresSpecialHandling: row.requires_special_handling,
    additionalNotes: row.additional_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body. Every server-owned field is absent by design. `.strict()`
 * rejects any client attempt to spoof `donation_request_id`, `created_at`,
 * etc.
 *
 * `donor_input_json` is required and must be a non-empty object — the
 * detail line carries no meaning without structured donor input.
 * `photos_count` is donor-supplied here but tends to be maintained by an
 * upload flow in practice; we accept it optionally and cap for sanity.
 */
export const createDonationRequestDetailSchema = z
  .object({
    donor_input_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length > 0, {
        message: "donor_input_json must not be empty",
      })
      .refine((obj) => Object.keys(obj).length <= 64, {
        message: "donor_input_json has too many top-level keys (max 64)",
      }),
    photos_count: z.coerce.number().int().min(0).max(1000).optional(),
    has_fragile_items: z.boolean().optional(),
    has_heavy_items: z.boolean().optional(),
    requires_special_handling: z.boolean().optional(),
    additional_notes: z.string().max(4000).optional(),
  })
  .strict();

export type CreateDonationRequestDetailInput = z.infer<
  typeof createDonationRequestDetailSchema
>;
