/**
 * Templates — read-only DTO.
 *
 * Aligned to `public.templates`. Org-scoped.
 */

export interface TemplateDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  templateTypeId: string;
  templateCode: string;
  nameAr: string;
  nameEn: string | null;
  languageCode: string;
  currentVersionNumber: number;
  status: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  template_type_id: string;
  template_code: string;
  name_ar: string;
  name_en: string | null;
  language_code: string;
  current_version_number: number;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function toTemplateDto(row: TemplateRow): TemplateDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    templateTypeId: row.template_type_id,
    templateCode: row.template_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    languageCode: row.language_code,
    currentVersionNumber: row.current_version_number,
    status: row.status,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Minimal scope row for org-membership checks (used by child resources:
 * versions, variables, and by notifications/campaigns that reference a
 * template_id).
 */
export interface TemplateScopeRow {
  id: string;
  organization_id: string;
}
