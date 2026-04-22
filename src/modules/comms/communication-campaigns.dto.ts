/**
 * Communication campaigns — DTO + create schema.
 *
 * Aligned to `public.communication_campaigns`. NOT NULL in DB:
 *   organization_id, campaign_code, name_ar, campaign_type,
 *   target_type, target_filter_json, channel, campaign_status,
 *   created_at, updated_at.
 *
 * This phase creates rows but does NOT trigger deliveries. The
 * `campaign_deliveries` endpoint is read-only; deliveries themselves
 * are produced by the later provider-execution layer.
 */

import { z } from "@lib/validation";

export interface CommunicationCampaignDto {
  id: string;
  organizationId: string;
  campaignCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  campaignType: string;
  targetType: string;
  targetFilterJson: Record<string, unknown>;
  templateId: string | null;
  channel: string;
  campaignStatus: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface CommunicationCampaignRow {
  id: string;
  organization_id: string;
  campaign_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  campaign_type: string;
  target_type: string;
  target_filter_json: Record<string, unknown> | null;
  template_id: string | null;
  channel: string;
  campaign_status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function toCommunicationCampaignDto(
  row: CommunicationCampaignRow
): CommunicationCampaignDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    campaignCode: row.campaign_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    campaignType: row.campaign_type,
    targetType: row.target_type,
    targetFilterJson: row.target_filter_json ?? {},
    templateId: row.template_id,
    channel: row.channel,
    campaignStatus: row.campaign_status,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * POST body. `campaign_status` defaults to "draft" server-side;
 * `started_at` / `completed_at` are outcome fields set by the delivery
 * layer, NOT writable here. `organization_id` is optional — service
 * derives it from `template_id` or from the caller's single-org
 * membership; multi-org callers must supply it explicitly and it must
 * belong to their set.
 */
export const createCommunicationCampaignSchema = z
  .object({
    organization_id: z.string().uuid().optional(),
    campaign_code: z.string().min(1).max(200),
    name_ar: z.string().min(1).max(500),
    name_en: z.string().max(500).optional(),
    description: z.string().max(4000).optional(),
    campaign_type: z.string().min(1).max(100),
    target_type: z.string().min(1).max(100),
    target_filter_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 128, {
        message: "target_filter_json has too many top-level keys (max 128)",
      })
      .optional(),
    template_id: z.string().uuid().optional(),
    channel: z.string().min(1).max(100),
    scheduled_at: z.string().datetime().optional(),
  })
  .strict();

export type CreateCommunicationCampaignInput = z.infer<
  typeof createCommunicationCampaignSchema
>;
