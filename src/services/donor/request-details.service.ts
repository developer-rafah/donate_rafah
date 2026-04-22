import "server-only";

/**
 * Donor donation-request details service.
 *
 * Every operation calls `assertRequestOwnedByDonor` first so the ownership
 * check lives in exactly one place (the requests service). This prevents a
 * future caller from forgetting the check.
 */

import type { DonorAuthedContext } from "@lib/auth";
import * as repo from "@repositories/donation_request_details/donation-request-details.repository";
import { assertRequestOwnedByDonor } from "./requests.service";
import {
  toDonationRequestDetailDto,
  type CreateDonationRequestDetailInput,
  type DonationRequestDetailDto,
} from "@modules/donor/request-details.dto";

export async function listDonorRequestDetails(
  ctx: DonorAuthedContext,
  requestId: string
): Promise<DonationRequestDetailDto[]> {
  await assertRequestOwnedByDonor(ctx, requestId);
  const rows = await repo.listByRequestId(requestId);
  return rows.map(toDonationRequestDetailDto);
}

export async function createDonorRequestDetail(
  ctx: DonorAuthedContext,
  requestId: string,
  input: CreateDonationRequestDetailInput
): Promise<DonationRequestDetailDto> {
  await assertRequestOwnedByDonor(ctx, requestId);

  // Per the real schema, `photos_count`, `has_fragile_items`,
  // `has_heavy_items`, `requires_special_handling` and `donor_input_json`
  // are all NOT NULL. The DB has no defaulting trigger for them, so the
  // service supplies safe defaults when the donor omitted an optional
  // field (0 for count, false for the booleans).
  const row = await repo.create({
    donation_request_id: requestId,
    donor_input_json: input.donor_input_json,
    photos_count: input.photos_count ?? 0,
    has_fragile_items: input.has_fragile_items ?? false,
    has_heavy_items: input.has_heavy_items ?? false,
    requires_special_handling: input.requires_special_handling ?? false,
    additional_notes: input.additional_notes ?? null,
  });

  return toDonationRequestDetailDto(row);
}
