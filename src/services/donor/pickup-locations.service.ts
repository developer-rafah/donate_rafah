import "server-only";

/**
 * Donor pickup locations service.
 *
 * Creates, lists and updates donor-owned pickup locations. `donor_id` is
 * always sourced from the authenticated donor context; the client cannot
 * supply or override it.
 */

import type { DonorAuthedContext } from "@lib/auth";
import * as repo from "@repositories/pickup_locations/pickup-locations.repository";
import {
  toPickupLocationDto,
  type CreatePickupLocationInput,
  type PickupLocationDto,
  type UpdatePickupLocationInput,
} from "@modules/donor/pickup-locations.dto";

export async function listDonorPickupLocations(
  ctx: DonorAuthedContext
): Promise<PickupLocationDto[]> {
  const rows = await repo.listByDonorId(ctx.donor.id);
  return rows.map(toPickupLocationDto);
}

export async function createDonorPickupLocation(
  ctx: DonorAuthedContext,
  input: CreatePickupLocationInput
): Promise<PickupLocationDto> {
  // `public.pickup_locations.organization_id` is NOT NULL. It always equals
  // the donor's own organization (donors.organization_id). Sourcing it from
  // the context here makes the insert succeed and prevents cross-org writes.
  const row = await repo.create({
    donor_id: ctx.donor.id,
    organization_id: ctx.donor.organizationId,
    city_ref_id: input.city_ref_id ?? null,
    district_ref_id: input.district_ref_id ?? null,
    address_line: input.address_line,
    landmark: input.landmark ?? null,
    building_type_ref_id: input.building_type_ref_id ?? null,
    floor_number: input.floor_number ?? null,
    has_elevator: input.has_elevator ?? null,
    parking_notes: input.parking_notes ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    is_default: input.is_default ?? null,
  });
  return toPickupLocationDto(row);
}

export async function updateDonorPickupLocation(
  ctx: DonorAuthedContext,
  input: UpdatePickupLocationInput
): Promise<PickupLocationDto> {
  const { id, ...patch } = input;
  const row = await repo.updateOwnedById(ctx.donor.id, id, patch);
  return toPickupLocationDto(row);
}
