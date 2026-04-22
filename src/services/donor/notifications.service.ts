import "server-only";

/**
 * Donor notifications service.
 *
 * Returns notifications addressed to the caller either via their donor
 * id OR their user id. Filters out rows whose parent notification row
 * no longer exists (the DTO mapper produces null for those).
 */

import type { DonorAuthedContext } from "@lib/auth";
import { listForDonorOrUser } from "@repositories/notifications/notifications.repository";
import {
  toDonorNotificationDto,
  type DonorNotificationDto,
} from "@modules/donor/notifications.dto";

export async function listDonorNotifications(
  ctx: DonorAuthedContext
): Promise<DonorNotificationDto[]> {
  const rows = await listForDonorOrUser(ctx.donor.id, ctx.user.id);
  return rows
    .map(toDonorNotificationDto)
    .filter((n): n is DonorNotificationDto => n !== null);
}
