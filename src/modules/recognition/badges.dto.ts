/**
 * Badges + badge awards.
 *
 * Aligned to `public.badges` and `public.badge_awards`.
 *
 * NOT NULL on awards: organization_id, badge_id, donor_id, awarded_at.
 */

import { z } from "@lib/validation";

// ---- Badges -----------------------------------------------------------------

export interface OpsBadgeDto {
  id: string;
  organizationId: string;
  badgeCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  iconFilePath: string | null;
  badgeLevel: number;
  criteriaPayloadJson: Record<string, unknown>;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OpsBadgeRow {
  id: string;
  organization_id: string;
  badge_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  icon_file_path: string | null;
  badge_level: number;
  criteria_payload_json: Record<string, unknown> | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function toOpsBadgeDto(row: OpsBadgeRow): OpsBadgeDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    badgeCode: row.badge_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    iconFilePath: row.icon_file_path,
    badgeLevel: row.badge_level,
    criteriaPayloadJson: row.criteria_payload_json ?? {},
    isActive: row.is_active,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- Badge awards -----------------------------------------------------------

export interface OpsBadgeAwardDto {
  id: string;
  organizationId: string;
  badgeId: string;
  donorId: string;
  awardReason: string | null;
  awardSourceEntityType: string | null;
  awardSourceEntityId: string | null;
  awardedAt: string;
  awardedBy: string | null;
  createdAt: string;
}

export interface OpsBadgeAwardRow {
  id: string;
  organization_id: string;
  badge_id: string;
  donor_id: string;
  award_reason: string | null;
  award_source_entity_type: string | null;
  award_source_entity_id: string | null;
  awarded_at: string;
  awarded_by: string | null;
  created_at: string;
}

export function toOpsBadgeAwardDto(row: OpsBadgeAwardRow): OpsBadgeAwardDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    badgeId: row.badge_id,
    donorId: row.donor_id,
    awardReason: row.award_reason,
    awardSourceEntityType: row.award_source_entity_type,
    awardSourceEntityId: row.award_source_entity_id,
    awardedAt: row.awarded_at,
    awardedBy: row.awarded_by,
    createdAt: row.created_at,
  };
}

/**
 * POST body. `donor_id` comes from the route; `organization_id` and
 * `awarded_by` are server-derived.
 */
export const createBadgeAwardSchema = z
  .object({
    badge_id: z.string().uuid(),
    award_reason: z.string().max(4000).optional(),
    award_source_entity_type: z.string().min(1).max(100).optional(),
    award_source_entity_id: z.string().uuid().optional(),
    awarded_at: z.string().datetime().optional(),
  })
  .strict();

export type CreateBadgeAwardInput = z.infer<typeof createBadgeAwardSchema>;
