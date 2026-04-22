import "server-only";

/**
 * Donor contact details service.
 *
 * Read and constrained update operations. The update path enforces donor
 * ownership at two layers: the schema rejects unknown keys, and the
 * repository's UPDATE is gated by both `id` and `donor_id`.
 */

import type { DonorAuthedContext } from "@lib/auth";
import {
  listByDonorId,
  updateOwnedById,
} from "@repositories/donor_contact_details/donor-contact-details.repository";
import {
  toDonorContactDetailDto,
  type DonorContactDetailDto,
  type UpdateDonorContactDetailInput,
} from "@modules/donor/contact-details.dto";

export async function listDonorContactDetails(
  ctx: DonorAuthedContext
): Promise<DonorContactDetailDto[]> {
  const rows = await listByDonorId(ctx.donor.id);
  return rows.map(toDonorContactDetailDto);
}

export async function updateDonorContactDetail(
  ctx: DonorAuthedContext,
  input: UpdateDonorContactDetailInput
): Promise<DonorContactDetailDto> {
  const { id, ...patch } = input;
  const row = await updateOwnedById(ctx.donor.id, id, patch);
  return toDonorContactDetailDto(row);
}
