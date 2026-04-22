/**
 * Certificate templates, rules, and issuance.
 *
 * Aligned to `public.certificate_templates`, `public.certificate_rules`,
 * and `public.issued_certificates`.
 *
 * NOT NULL on issued_certificates: organization_id,
 * certificate_template_id, donor_id, certificate_number, issue_status,
 * metadata_json.
 *
 * `pdf_attachment_id`, `verification_code`, `issued_at` are all
 * nullable — accepted optionally on issuance.
 */

import { z } from "@lib/validation";

// ---- Templates --------------------------------------------------------------

export interface OpsCertificateTemplateDto {
  id: string;
  organizationId: string;
  templateCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  layoutType: string;
  templateContentJson: Record<string, unknown>;
  backgroundAttachmentId: string | null;
  fontConfigJson: Record<string, unknown>;
  isActive: boolean;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpsCertificateTemplateRow {
  id: string;
  organization_id: string;
  template_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  layout_type: string;
  template_content_json: Record<string, unknown> | null;
  background_attachment_id: string | null;
  font_config_json: Record<string, unknown> | null;
  is_active: boolean;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export function toOpsCertificateTemplateDto(
  row: OpsCertificateTemplateRow
): OpsCertificateTemplateDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    templateCode: row.template_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    layoutType: row.layout_type,
    templateContentJson: row.template_content_json ?? {},
    backgroundAttachmentId: row.background_attachment_id,
    fontConfigJson: row.font_config_json ?? {},
    isActive: row.is_active,
    versionNumber: row.version_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- Rules ------------------------------------------------------------------

export interface CertificateRuleDto {
  id: string;
  organizationId: string;
  ruleCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  certificateTemplateId: string;
  triggerEventCode: string;
  entityType: string;
  conditionPayloadJson: Record<string, unknown>;
  issueMode: string;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateRuleRow {
  id: string;
  organization_id: string;
  rule_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  certificate_template_id: string;
  trigger_event_code: string;
  entity_type: string;
  condition_payload_json: Record<string, unknown> | null;
  issue_mode: string;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toCertificateRuleDto(row: CertificateRuleRow): CertificateRuleDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ruleCode: row.rule_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    certificateTemplateId: row.certificate_template_id,
    triggerEventCode: row.trigger_event_code,
    entityType: row.entity_type,
    conditionPayloadJson: row.condition_payload_json ?? {},
    issueMode: row.issue_mode,
    isActive: row.is_active,
    startAt: row.start_at,
    endAt: row.end_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- Issued certificates ---------------------------------------------------

export interface OpsIssuedCertificateDto {
  id: string;
  organizationId: string;
  certificateTemplateId: string;
  certificateRuleId: string | null;
  donorId: string;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  certificateNumber: string;
  issueStatus: string;
  issuedAt: string | null;
  issuedBy: string | null;
  pdfAttachmentId: string | null;
  verificationCode: string | null;
  metadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OpsIssuedCertificateRow {
  id: string;
  organization_id: string;
  certificate_template_id: string;
  certificate_rule_id: string | null;
  donor_id: string;
  source_entity_type: string | null;
  source_entity_id: string | null;
  certificate_number: string;
  issue_status: string;
  issued_at: string | null;
  issued_by: string | null;
  pdf_attachment_id: string | null;
  verification_code: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function toOpsIssuedCertificateDto(
  row: OpsIssuedCertificateRow
): OpsIssuedCertificateDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    certificateTemplateId: row.certificate_template_id,
    certificateRuleId: row.certificate_rule_id,
    donorId: row.donor_id,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    certificateNumber: row.certificate_number,
    issueStatus: row.issue_status,
    issuedAt: row.issued_at,
    issuedBy: row.issued_by,
    pdfAttachmentId: row.pdf_attachment_id,
    verificationCode: row.verification_code,
    metadataJson: row.metadata_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body for issuance. `donor_id` comes from the route;
 * `organization_id`, `certificate_number`, `verification_code`,
 * `issue_status`, `issued_by`, `issued_at`, `created_by` are all
 * server-derived.
 *
 * `pdf_attachment_id` is optional — when supplied it must reference an
 * attachments row in the caller's org. If omitted, the certificate is
 * recorded in `"pending"` status (PDF rendering is out of scope for
 * this phase).
 */
export const createIssuedCertificateSchema = z
  .object({
    certificate_template_id: z.string().uuid(),
    certificate_rule_id: z.string().uuid().optional(),
    source_entity_type: z.string().min(1).max(100).optional(),
    source_entity_id: z.string().uuid().optional(),
    pdf_attachment_id: z.string().uuid().optional(),
    metadata_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 128, {
        message: "metadata_json has too many top-level keys (max 128)",
      })
      .optional(),
  })
  .strict();

export type CreateIssuedCertificateInput = z.infer<typeof createIssuedCertificateSchema>;
