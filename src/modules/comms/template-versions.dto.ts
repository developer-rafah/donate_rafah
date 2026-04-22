/**
 * Template versions & variables — read-only DTOs.
 *
 * Aligned to `public.template_versions` and `public.template_variables`.
 * Neither table carries `organization_id`; scoping goes through the
 * parent `templates` row.
 */

export interface TemplateVersionDto {
  id: string;
  templateId: string;
  versionNumber: number;
  subjectText: string | null;
  bodyContent: string;
  bodyFormat: string;
  variablesJson: Record<string, unknown>;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface TemplateVersionRow {
  id: string;
  template_id: string;
  version_number: number;
  subject_text: string | null;
  body_content: string;
  body_format: string;
  variables_json: Record<string, unknown> | null;
  status: string;
  published_at: string | null;
  created_at: string;
  created_by: string | null;
}

export function toTemplateVersionDto(row: TemplateVersionRow): TemplateVersionDto {
  return {
    id: row.id,
    templateId: row.template_id,
    versionNumber: row.version_number,
    subjectText: row.subject_text,
    bodyContent: row.body_content,
    bodyFormat: row.body_format,
    variablesJson: row.variables_json ?? {},
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface TemplateVariableDto {
  id: string;
  templateId: string;
  variableKey: string;
  variableLabelAr: string;
  variableLabelEn: string | null;
  variableType: string;
  sampleValue: string | null;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariableRow {
  id: string;
  template_id: string;
  variable_key: string;
  variable_label_ar: string;
  variable_label_en: string | null;
  variable_type: string;
  sample_value: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export function toTemplateVariableDto(row: TemplateVariableRow): TemplateVariableDto {
  return {
    id: row.id,
    templateId: row.template_id,
    variableKey: row.variable_key,
    variableLabelAr: row.variable_label_ar,
    variableLabelEn: row.variable_label_en,
    variableType: row.variable_type,
    sampleValue: row.sample_value,
    isRequired: row.is_required,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
