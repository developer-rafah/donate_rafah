import "server-only";

/**
 * Donor contact details repository.
 *
 * Reads and writes against `public.donor_contact_details`. Every update is
 * gated by BOTH `id` AND `donor_id` in the WHERE clause so a foreign row
 * update matches zero rows even if RLS is misconfigured.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError, NotFoundError } from "@lib/errors";
import type { DonorContactDetailRow } from "@modules/donor/contact-details.dto";

const TABLE = "donor_contact_details";

const SELECT_COLUMNS =
  "id, donor_id, mobile_number, secondary_mobile_number, email, " +
  "city_ref_id, district_ref_id, address_line, latitude, longitude, " +
  "preferred_contact_time, contact_notes, is_primary, " +
  "created_at, updated_at";

export async function listByDonorId(donorId: string): Promise<DonorContactDetailRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donor_id", donorId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new DependencyError("Failed to list donor contact details", error);
  }
  return (data ?? []) as unknown as DonorContactDetailRow[];
}

/**
 * Writable subset for PATCH. Mirrors `DONOR_CONTACT_DETAIL_WRITABLE_FIELDS`
 * in the domain layer — keep both in sync if either changes.
 */
export type DonorContactDetailPatch = Partial<
  Pick<
    DonorContactDetailRow,
    | "mobile_number"
    | "secondary_mobile_number"
    | "email"
    | "city_ref_id"
    | "district_ref_id"
    | "address_line"
    | "latitude"
    | "longitude"
    | "preferred_contact_time"
    | "contact_notes"
    | "is_primary"
  >
>;

export async function updateOwnedById(
  donorId: string,
  id: string,
  patch: DonorContactDetailPatch
): Promise<DonorContactDetailRow> {
  const supabase = await createSupabaseServerClient();

  // Build the patch explicitly — never pass arbitrary keys to the driver.
  const safe: Record<string, unknown> = {};
  if (patch.mobile_number !== undefined) safe.mobile_number = patch.mobile_number;
  if (patch.secondary_mobile_number !== undefined)
    safe.secondary_mobile_number = patch.secondary_mobile_number;
  if (patch.email !== undefined) safe.email = patch.email;
  if (patch.city_ref_id !== undefined) safe.city_ref_id = patch.city_ref_id;
  if (patch.district_ref_id !== undefined) safe.district_ref_id = patch.district_ref_id;
  if (patch.address_line !== undefined) safe.address_line = patch.address_line;
  if (patch.latitude !== undefined) safe.latitude = patch.latitude;
  if (patch.longitude !== undefined) safe.longitude = patch.longitude;
  if (patch.preferred_contact_time !== undefined)
    safe.preferred_contact_time = patch.preferred_contact_time;
  if (patch.contact_notes !== undefined) safe.contact_notes = patch.contact_notes;
  if (patch.is_primary !== undefined) safe.is_primary = patch.is_primary;

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("id", id)
    .eq("donor_id", donorId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to update donor contact detail", error);
  }
  if (!data) {
    throw new NotFoundError("Contact detail not found for this donor");
  }
  return data as unknown as DonorContactDetailRow;
}
