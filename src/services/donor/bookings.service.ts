import "server-only";

/**
 * Donor bookings service — read-only, scoped to the caller's own request.
 */

import type { DonorAuthedContext } from "@lib/auth";
import * as repo from "@repositories/bookings/bookings.repository";
import { assertRequestOwnedByDonor } from "./requests.service";
import {
  toDonorBookingDto,
  type DonorBookingDto,
} from "@modules/donor/bookings.dto";

export async function listDonorBookingsForRequest(
  ctx: DonorAuthedContext,
  requestId: string
): Promise<DonorBookingDto[]> {
  await assertRequestOwnedByDonor(ctx, requestId);
  const rows = await repo.listByRequestId(requestId);
  return rows.map(toDonorBookingDto);
}
