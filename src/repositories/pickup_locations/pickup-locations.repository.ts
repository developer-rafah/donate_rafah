import "server-only";

/**
 * Pickup locations repository.
 *
 * Reads and writes against `public.pickup_locations`. All writes are gated
 * by `donor_id` in the WHERE clause — defense-in-depth alongside RLS.
 *
 * Column set matches the SQL contract; see modules/donor/pickup-locations.dto
 * for the full schema comment.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError, NotFoundError } from "@lib/errors";
import type { PickupLocationRow } from "@modules/donor/pickup-locations.dto";

const TABLE = "pickup_locations";

const SELECT_COLUMNS =
  "id, organization_id, donor_id, city_ref_id, district_ref_id, " +
  "address_line, landmark, building_type_ref_id, floor_number, has_elevator, " +
  "parking_notes, latitude, longitude, is_default, " +
  "created_at, updated_at, created_by, updated_by";

export async function listByDonorId(donorId: string): Promise<PickupLocationRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donor_id", donorId)
    .order("created_at", { ascending: true });

  if (error) throw new DependencyError("Failed to list pickup locations", error);
  return (data ?? []) as unknown as PickupLocationRow[];
}

export async function findOwnedById(
  donorId: string,
  id: string
): Promise<PickupLocationRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .eq("donor_id", donorId)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load pickup location", error);
  return (data as unknown as PickupLocationRow) ?? null;
}

/**
 * Full creation payload. `donor_id`, `organization_id`, and audit fields
 * are populated by the service layer (donor_id from context,
 * organization_id either derived from donor's current org membership or
 * left null). The repository itself only validates the shape is known.
 */
export interface CreatePickupLocationDbInput {
  donor_id: string;
  organization_id: string | null;
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
  is_default: boolean | null;
}

export async function create(
  input: CreatePickupLocationDbInput
): Promise<PickupLocationRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create pickup location", error);
  return data as unknown as PickupLocationRow;
}

/**
 * Writable subset. Mirrors `DONOR_PICKUP_LOCATION_WRITABLE_FIELDS` in the
 * domain layer — keep the two in sync if either is edited.
 */
export type PickupLocationPatch = Partial<
  Pick<
    PickupLocationRow,
    | "city_ref_id"
    | "district_ref_id"
    | "address_line"
    | "landmark"
    | "building_type_ref_id"
    | "floor_number"
    | "has_elevator"
    | "parking_notes"
    | "latitude"
    | "longitude"
    | "is_default"
  >
>;

export async function updateOwnedById(
  donorId: string,
  id: string,
  patch: PickupLocationPatch
): Promise<PickupLocationRow> {
  const supabase = await createSupabaseServerClient();

  // Build the patch explicitly so unknown keys never reach the driver even
  // if a caller passes extras.
  const safe: Record<string, unknown> = {};
  if (patch.city_ref_id !== undefined) safe.city_ref_id = patch.city_ref_id;
  if (patch.district_ref_id !== undefined) safe.district_ref_id = patch.district_ref_id;
  if (patch.address_line !== undefined) safe.address_line = patch.address_line;
  if (patch.landmark !== undefined) safe.landmark = patch.landmark;
  if (patch.building_type_ref_id !== undefined) safe.building_type_ref_id = patch.building_type_ref_id;
  if (patch.floor_number !== undefined) safe.floor_number = patch.floor_number;
  if (patch.has_elevator !== undefined) safe.has_elevator = patch.has_elevator;
  if (patch.parking_notes !== undefined) safe.parking_notes = patch.parking_notes;
  if (patch.latitude !== undefined) safe.latitude = patch.latitude;
  if (patch.longitude !== undefined) safe.longitude = patch.longitude;
  if (patch.is_default !== undefined) safe.is_default = patch.is_default;

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("id", id)
    .eq("donor_id", donorId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to update pickup location", error);
  if (!data) throw new NotFoundError("Pickup location not found for this donor");
  return data as unknown as PickupLocationRow;
}
