/**
 * Campaign deliveries — read-only DTO.
 *
 * Aligned to `public.campaign_deliveries`. No writes in this phase —
 * deliveries are produced by the provider-execution layer in a later
 * phase.
 */

export interface CampaignDeliveryDto {
  id: string;
  campaignId: string;
  recipientType: string;
  recipientId: string | null;
  notificationId: string | null;
  deliveryStatus: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDeliveryRow {
  id: string;
  campaign_id: string;
  recipient_type: string;
  recipient_id: string | null;
  notification_id: string | null;
  delivery_status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function toCampaignDeliveryDto(row: CampaignDeliveryRow): CampaignDeliveryDto {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    recipientType: row.recipient_type,
    recipientId: row.recipient_id,
    notificationId: row.notification_id,
    deliveryStatus: row.delivery_status,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
