/**
 * Template types — read-only DTO.
 *
 * Aligned to `public.template_types`. Org-scoped.
 */

export interface TemplateTypeDto {
  id: string;
  organizationId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  supportedChannelsJson: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateTypeRow {
  id: string;
  organization_id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  supported_channels_json: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function toTemplateTypeDto(row: TemplateTypeRow): TemplateTypeDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    supportedChannelsJson: row.supported_channels_json ?? {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
