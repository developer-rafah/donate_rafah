/**
 * Donor notifications — DTOs.
 *
 * Aligned to the real SQL contract:
 *   public.notifications (
 *     id, organization_id, branch_id, template_id,
 *     notification_type, channel,
 *     target_type, target_id,
 *     subject_text, message_body,
 *     status, scheduled_at, sent_at, failed_at, failure_reason,
 *     payload_json, created_at, updated_at, created_by
 *   )
 *   public.notification_recipients (
 *     id, notification_id, user_id, donor_id,
 *     recipient_name, recipient_phone, recipient_email,
 *     delivery_status, delivered_at, read_at, failure_reason,
 *     created_at, updated_at
 *   )
 *
 * Donor-facing listing filters by `donor_id` primarily (the direct link),
 * falling back to `user_id` — the repository does the query.
 */

export interface DonorNotificationDto {
  recipientId: string;
  notificationId: string;
  subjectText: string | null;
  messageBody: string;
  notificationType: string;
  channel: string;
  deliveryStatus: string;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface DonorNotificationRow {
  id: string;
  notification_id: string;
  delivery_status: string;
  delivered_at: string | null;
  read_at: string | null;
  notifications: {
    id: string;
    subject_text: string | null;
    message_body: string;
    notification_type: string;
    channel: string;
    created_at: string;
  } | null;
}

export function toDonorNotificationDto(
  row: DonorNotificationRow
): DonorNotificationDto | null {
  if (!row.notifications) return null;
  return {
    recipientId: row.id,
    notificationId: row.notification_id,
    subjectText: row.notifications.subject_text,
    messageBody: row.notifications.message_body,
    notificationType: row.notifications.notification_type,
    channel: row.notifications.channel,
    deliveryStatus: row.delivery_status,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    createdAt: row.notifications.created_at,
  };
}
