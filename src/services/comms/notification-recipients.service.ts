import "server-only";

/**
 * Notification recipients — ops-side service.
 *
 * Parent-notification ownership is verified first; delivery status
 * defaults to "pending" server-side. No external delivery side effects.
 */

import type { OpsAuthedContext } from "@lib/auth";
import * as repo from "@repositories/notification_recipients/notification-recipients.repository";
import { assertNotificationInCallerOrgs } from "./notifications.service";
import { OPS_NOTIFICATION_RECIPIENT_DEFAULT_DELIVERY_STATUS } from "@domain/comms/rules";
import {
  toOpsNotificationRecipientDto,
  type CreateOpsNotificationRecipientInput,
  type OpsNotificationRecipientDto,
} from "@modules/comms/notification-recipients.dto";

export async function listRecipientsForNotification(
  ctx: OpsAuthedContext,
  notificationId: string
): Promise<OpsNotificationRecipientDto[]> {
  await assertNotificationInCallerOrgs(ctx, notificationId);
  const rows = await repo.listByNotificationId(notificationId);
  return rows.map(toOpsNotificationRecipientDto);
}

export async function createRecipientForNotification(
  ctx: OpsAuthedContext,
  notificationId: string,
  input: CreateOpsNotificationRecipientInput
): Promise<OpsNotificationRecipientDto> {
  await assertNotificationInCallerOrgs(ctx, notificationId);

  const row = await repo.create({
    notification_id: notificationId,
    user_id: input.user_id ?? null,
    donor_id: input.donor_id ?? null,
    recipient_name: input.recipient_name ?? null,
    recipient_phone: input.recipient_phone ?? null,
    recipient_email: input.recipient_email ?? null,
    delivery_status: OPS_NOTIFICATION_RECIPIENT_DEFAULT_DELIVERY_STATUS,
  });

  return toOpsNotificationRecipientDto(row);
}
