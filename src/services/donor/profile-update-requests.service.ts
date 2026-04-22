import "server-only";

/**
 * Donor profile update requests service.
 *
 * Aligned to the real SQL contract. Security-critical: `donor_id` and
 * `requested_by_user_id` are ALWAYS sourced from the authenticated context.
 * `submitted_at` is stamped server-side. `status` is DB-defaulted (schema
 * has no visible trigger but the column has a default); the client cannot
 * influence it.
 */

import type { DonorAuthedContext } from "@lib/auth";
import {
  listByDonorId,
  create,
} from "@repositories/donor_profile_update_requests/donor-profile-update-requests.repository";
import {
  toDonorProfileUpdateRequestDto,
  type CreateDonorProfileUpdateRequestInput,
  type DonorProfileUpdateRequestDto,
} from "@modules/donor/profile-update-requests.dto";

export async function listDonorProfileUpdateRequests(
  ctx: DonorAuthedContext
): Promise<DonorProfileUpdateRequestDto[]> {
  const rows = await listByDonorId(ctx.donor.id);
  return rows.map(toDonorProfileUpdateRequestDto);
}

export async function createDonorProfileUpdateRequest(
  ctx: DonorAuthedContext,
  input: CreateDonorProfileUpdateRequestInput
): Promise<DonorProfileUpdateRequestDto> {
  const row = await create({
    donor_id: ctx.donor.id,
    requested_by_user_id: ctx.user.id,
    request_type: input.request_type,
    current_data_json: input.current_data_json,
    requested_data_json: input.requested_data_json,
    submitted_at: new Date().toISOString(),
  });
  return toDonorProfileUpdateRequestDto(row);
}
