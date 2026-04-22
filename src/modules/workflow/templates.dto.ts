/**
 * Workflow templates — read-only DTO.
 *
 * Aligned to `public.workflow_templates`. This phase does NOT expose any
 * template CRUD beyond list/detail reads; creation of templates is an
 * out-of-scope administrative concern.
 */

export interface WorkflowTemplateDto {
  id: string;
  organizationId: string;
  templateCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  entityType: string;
  donationTypeRefId: string | null;
  donationCategoryRefId: string | null;
  branchId: string | null;
  isDefault: boolean;
  isActive: boolean;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplateRow {
  id: string;
  organization_id: string;
  template_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  entity_type: string;
  donation_type_ref_id: string | null;
  donation_category_ref_id: string | null;
  branch_id: string | null;
  is_default: boolean;
  is_active: boolean;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export function toWorkflowTemplateDto(row: WorkflowTemplateRow): WorkflowTemplateDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    templateCode: row.template_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    entityType: row.entity_type,
    donationTypeRefId: row.donation_type_ref_id,
    donationCategoryRefId: row.donation_category_ref_id,
    branchId: row.branch_id,
    isDefault: row.is_default,
    isActive: row.is_active,
    versionNumber: row.version_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
