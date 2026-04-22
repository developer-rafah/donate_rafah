/**
 * Donor contact details — DTOs + Zod schemas.
 *
 * Aligned to the real SQL contract:
 *   public.donor_contact_details (
 *     id,
 *     donor_id,
 *     mobile_number,                  -- NOT NULL
 *     secondary_mobile_number,
 *     email,
 *     city_ref_id,
 *     district_ref_id,
 *     address_line,
 *     latitude,
 *     longitude,
 *     preferred_contact_time,
 *     contact_notes,
 *     is_primary,                     -- NOT NULL
 *     created_at, updated_at,         -- NOT NULL
 *     created_by, updated_by
 *   )
 *
 * Donor-writable fields: everything except id, donor_id, and audit fields.
 * `mobile_number` is required on create (schema NOT NULL) and non-empty on
 * patch if supplied.
 */

import { z } from "@lib/validation";

export interface DonorContactDetailDto {
  id: string;
  donorId: string;
  mobileNumber: string;
  secondaryMobileNumber: string | null;
  email: string | null;
  cityRefId: string | null;
  districtRefId: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  preferredContactTime: string | null;
  contactNotes: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonorContactDetailRow {
  id: string;
  donor_id: string;
  mobile_number: string;
  secondary_mobile_number: string | null;
  email: string | null;
  city_ref_id: string | null;
  district_ref_id: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_contact_time: string | null;
  contact_notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function toDonorContactDetailDto(row: DonorContactDetailRow): DonorContactDetailDto {
  return {
    id: row.id,
    donorId: row.donor_id,
    mobileNumber: row.mobile_number,
    secondaryMobileNumber: row.secondary_mobile_number,
    email: row.email,
    cityRefId: row.city_ref_id,
    districtRefId: row.district_ref_id,
    addressLine: row.address_line,
    latitude: row.latitude,
    longitude: row.longitude,
    preferredContactTime: row.preferred_contact_time,
    contactNotes: row.contact_notes,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Shared field validators
const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);
const phone = z.string().min(3).max(40);
const email = z.string().email().max(320);

/**
 * PATCH body: target row id + strict allowlist of writable fields.
 * Unknown keys are rejected (`.strict()`). At least one writable field
 * must be supplied.
 */
export const updateDonorContactDetailSchema = z
  .object({
    id: z.string().uuid(),
    mobile_number: phone.optional(),
    secondary_mobile_number: phone.nullable().optional(),
    email: email.nullable().optional(),
    city_ref_id: z.string().uuid().nullable().optional(),
    district_ref_id: z.string().uuid().nullable().optional(),
    address_line: z.string().min(1).max(1000).nullable().optional(),
    latitude: latitude.nullable().optional(),
    longitude: longitude.nullable().optional(),
    preferred_contact_time: z.string().max(200).nullable().optional(),
    contact_notes: z.string().max(2000).nullable().optional(),
    is_primary: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => {
      const { id: _id, ...rest } = body;
      return Object.values(rest).some((v) => v !== undefined);
    },
    { message: "At least one writable field must be provided" }
  );

export type UpdateDonorContactDetailInput = z.infer<typeof updateDonorContactDetailSchema>;
