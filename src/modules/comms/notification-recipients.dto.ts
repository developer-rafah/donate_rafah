/**
 * Notification recipients (ops-side) — DTO + create schema.
 *
 * Aligned to `public.notification_recipients`. NOT NULL in DB:
 *   notification_id, delivery_status, created_at, updated_at.
 *
 * Identity fields: at least one addressing signal is required (either a
 * `user_id`/`donor_id` internal link, or an explicit
 * `recipient_name`+(`recipient_phone`|`recipient_email`) combination).
 * Enforced at the Zod layer via a `.refine`.
 *
 * Delivery outcome fields (`delivered_at`, `read_at`, `failure_reason`)
 * are NOT writable here — those are delivery-side updates owned by the
 * provider-execution phase.
 */

import { z } from "@lib/validation";

export interface OpsNotificationRecipientDto {
  id: string;
  notificationId: string;
  userId: string | null;
  donorId: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  deliveryStatus: string;
  deliveredAt: string | null;
  readAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpsNotificationRecipientRow {
  id: string;
  notification_id: string;
  user_id: string | null;
  donor_id: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  delivery_status: string;
  delivered_at: string | null;
  read_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function toOpsNotificationRecipientDto(
  row: OpsNotificationRecipientRow
): OpsNotificationRecipientDto {
  return {
    id: row.id,
    notificationId: row.notification_id,
    userId: row.user_id,
    donorId: row.donor_id,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    recipientEmail: row.recipient_email,
    deliveryStatus: row.delivery_status,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body for creating a recipient. `notification_id` comes from the
 * route, `delivery_status` defaults to "pending" server-side.
 *
 * At least one addressing signal must be provided: a user_id, a
 * donor_id, or an explicit (recipient_name + phone-or-email) combo.
 */
export const createOpsNotificationRecipientSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    donor_id: z.string().uuid().optional(),
    recipient_name: z.string().min(1).max(500).optional(),
    recipient_phone: z.string().min(3).max(40).optional(),
    recipient_email: z.string().email().max(320).optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.user_id !== undefined ||
      body.donor_id !== undefined ||
      body.recipient_phone !== undefined ||
      body.recipient_email !== undefined,
    {
      message:
        "At least one of user_id, donor_id, recipient_phone, or recipient_email is required",
    }
  );

export type CreateOpsNotificationRecipientInput = z.infer<
  typeof createOpsNotificationRecipientSchema
>;
