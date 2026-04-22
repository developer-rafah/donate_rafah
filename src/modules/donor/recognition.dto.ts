/**
 * Donor recognition DTOs — points, badges, certificates.
 *
 * Aligned to the real SQL contract:
 *
 *   public.points_ledger (
 *     id, organization_id, donor_id, rule_id,
 *     source_entity_type, source_entity_id,
 *     points_delta, balance_after, ledger_type,
 *     notes, awarded_at, created_at, created_by
 *   )
 *
 *   public.badges (
 *     id, organization_id, badge_code, name_ar, name_en, description,
 *     icon_file_path, badge_level, criteria_payload_json,
 *     is_active, is_public, created_at, updated_at, created_by, updated_by
 *   )
 *   public.badge_awards (
 *     id, organization_id, badge_id, donor_id,
 *     award_reason, award_source_entity_type, award_source_entity_id,
 *     awarded_at, awarded_by, created_at
 *   )
 *
 *   public.certificate_templates (
 *     id, organization_id, template_code, name_ar, name_en, description,
 *     layout_type, template_content_json, background_attachment_id,
 *     font_config_json, is_active, version_number,
 *     created_at, updated_at, created_by, updated_by
 *   )
 *   public.issued_certificates (
 *     id, organization_id, certificate_template_id, certificate_rule_id,
 *     donor_id, source_entity_type, source_entity_id,
 *     certificate_number, issue_status, issued_at, issued_by,
 *     pdf_attachment_id, verification_code, metadata_json,
 *     created_at, updated_at, created_by, updated_by
 *   )
 *
 * Multilingual display (`name_ar` / `name_en`) is NOT collapsed — both are
 * surfaced so the client can pick the active locale.
 */

// ---- Points -----------------------------------------------------------------

export interface DonorPointsLedgerEntryDto {
  id: string;
  donorId: string;
  pointsDelta: number;
  balanceAfter: number;
  ledgerType: string;
  notes: string | null;
  awardedAt: string;
}

export interface DonorPointsLedgerRow {
  id: string;
  donor_id: string;
  points_delta: number;
  balance_after: number;
  ledger_type: string;
  notes: string | null;
  awarded_at: string;
}

export function toDonorPointsLedgerEntryDto(
  row: DonorPointsLedgerRow
): DonorPointsLedgerEntryDto {
  return {
    id: row.id,
    donorId: row.donor_id,
    pointsDelta: row.points_delta,
    balanceAfter: row.balance_after,
    ledgerType: row.ledger_type,
    notes: row.notes,
    awardedAt: row.awarded_at,
  };
}

// ---- Badges -----------------------------------------------------------------

export interface DonorBadgeAwardDto {
  id: string;
  donorId: string;
  awardedAt: string;
  awardReason: string | null;
  badge: {
    id: string;
    badgeCode: string;
    nameAr: string;
    nameEn: string | null;
    iconFilePath: string | null;
    badgeLevel: number;
  } | null;
}

export interface DonorBadgeAwardRow {
  id: string;
  donor_id: string;
  awarded_at: string;
  award_reason: string | null;
  badges: {
    id: string;
    badge_code: string;
    name_ar: string;
    name_en: string | null;
    icon_file_path: string | null;
    badge_level: number;
  } | null;
}

export function toDonorBadgeAwardDto(row: DonorBadgeAwardRow): DonorBadgeAwardDto {
  return {
    id: row.id,
    donorId: row.donor_id,
    awardedAt: row.awarded_at,
    awardReason: row.award_reason,
    badge: row.badges
      ? {
          id: row.badges.id,
          badgeCode: row.badges.badge_code,
          nameAr: row.badges.name_ar,
          nameEn: row.badges.name_en,
          iconFilePath: row.badges.icon_file_path,
          badgeLevel: row.badges.badge_level,
        }
      : null,
  };
}

// ---- Certificates -----------------------------------------------------------

export interface DonorCertificateDto {
  id: string;
  donorId: string;
  certificateNumber: string;
  issueStatus: string;
  issuedAt: string | null;
  verificationCode: string | null;
  pdfAttachmentId: string | null;
  template: {
    id: string;
    templateCode: string;
    nameAr: string;
    nameEn: string | null;
  } | null;
}

export interface DonorCertificateRow {
  id: string;
  donor_id: string;
  certificate_number: string;
  issue_status: string;
  issued_at: string | null;
  verification_code: string | null;
  pdf_attachment_id: string | null;
  certificate_templates: {
    id: string;
    template_code: string;
    name_ar: string;
    name_en: string | null;
  } | null;
}

export function toDonorCertificateDto(row: DonorCertificateRow): DonorCertificateDto {
  return {
    id: row.id,
    donorId: row.donor_id,
    certificateNumber: row.certificate_number,
    issueStatus: row.issue_status,
    issuedAt: row.issued_at,
    verificationCode: row.verification_code,
    pdfAttachmentId: row.pdf_attachment_id,
    template: row.certificate_templates
      ? {
          id: row.certificate_templates.id,
          templateCode: row.certificate_templates.template_code,
          nameAr: row.certificate_templates.name_ar,
          nameEn: row.certificate_templates.name_en,
        }
      : null,
  };
}
