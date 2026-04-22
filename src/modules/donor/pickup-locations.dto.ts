/**
 * Donor pickup locations — DTOs + Zod schemas.
 *
 * Aligned to the real SQL contract:
 *   public.pickup_locations (
 *     id,
 *     organization_id,
 *     donor_id,
 *     city_ref_id,
 *     district_ref_id,
 *     address_line,
 *     landmark,
 *     building_type_ref_id,
 *     floor_number,
 *     has_elevator,
 *     parking_notes,
 *     latitude,
 *     longitude,
 *     is_default,
 *     created_at,
 *     updated_at,
 *     created_by,
 *     updated_by
 *   )
 *
 * Donor-writable fields do NOT include: donor_id, organization_id,
 * created_by, updated_by, created_at, updated_at — all server- or
 * audit-owned.
 *
 * ASSUMPTION: `city_ref_id`, `district_ref_id`, and `building_type_ref_id`
 * are uuid foreign keys into reference_values / similar lookup tables. If
 * they turn out to be integer reference keys, change the Zod schema type
 * for those three fields only; no other file needs to change.
 */

import { z } from "@lib/validation";

export interface PickupLocationDto {
  id: string;
  organizationId: string | null;
  donorId: string;
  cityRefId: string | null;
  districtRefId: string | null;
  addressLine: string;
  landmark: string | null;
  buildingTypeRefId: string | null;
  floorNumber: number | null;
  hasElevator: boolean | null;
  parkingNotes: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface PickupLocationRow {
  id: string;
  organization_id: string | null;
  donor_id: string;
  city_ref_id: string | null;
  district_ref_id: string | null;
  address_line: string;
  landmark: string | null;
  building_type_ref_id: string | null;
  floor_number: number | null;
  has_elevator: boolean | null;
  parking_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export function toPickupLocationDto(row: PickupLocationRow): PickupLocationDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    donorId: row.donor_id,
    cityRefId: row.city_ref_id,
    districtRefId: row.district_ref_id,
    addressLine: row.address_line,
    landmark: row.landmark,
    buildingTypeRefId: row.building_type_ref_id,
    floorNumber: row.floor_number,
    hasElevator: row.has_elevator,
    parkingNotes: row.parking_notes,
    latitude: row.latitude,
    longitude: row.longitude,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);
const floorNumber = z.coerce.number().int().min(-10).max(200);

/**
 * POST body. `donor_id`, `organization_id`, and audit fields are NEVER
 * accepted from the client.
 */
export const createPickupLocationSchema = z
  .object({
    city_ref_id: z.string().uuid().optional(),
    district_ref_id: z.string().uuid().optional(),
    address_line: z.string().min(1).max(1000),
    landmark: z.string().max(500).optional(),
    building_type_ref_id: z.string().uuid().optional(),
    floor_number: floorNumber.optional(),
    has_elevator: z.boolean().optional(),
    parking_notes: z.string().max(2000).optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
    is_default: z.boolean().optional(),
  })
  .strict();

export type CreatePickupLocationInput = z.infer<typeof createPickupLocationSchema>;

/**
 * PATCH body. `id` identifies the row; every other field is drawn from the
 * writable allowlist and optional. At least one writable field required.
 */
export const updatePickupLocationSchema = z
  .object({
    id: z.string().uuid(),
    city_ref_id: z.string().uuid().optional(),
    district_ref_id: z.string().uuid().optional(),
    address_line: z.string().min(1).max(1000).optional(),
    landmark: z.string().max(500).optional(),
    building_type_ref_id: z.string().uuid().optional(),
    floor_number: floorNumber.optional(),
    has_elevator: z.boolean().optional(),
    parking_notes: z.string().max(2000).optional(),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
    is_default: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => {
      const { id: _id, ...rest } = body;
      return Object.values(rest).some((v) => v !== undefined);
    },
    { message: "At least one writable field must be provided" }
  );

export type UpdatePickupLocationInput = z.infer<typeof updatePickupLocationSchema>;
