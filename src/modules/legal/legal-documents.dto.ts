/**
 * Legal documents — read-only DTO.
 *
 * Aligned to `public.legal_documents`. Org-scoped via `organization_id`.
 */

export interface LegalDocumentDto {
  id: string;
  organizationId: string;
  documentType: string;
  documentCode: string;
  titleAr: string;
  titleEn: string | null;
  contentBody: string;
  languageCode: string;
  versionNumber: number;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  requiresAcceptance: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegalDocumentRow {
  id: string;
  organization_id: string;
  document_type: string;
  document_code: string;
  title_ar: string;
  title_en: string | null;
  content_body: string;
  language_code: string;
  version_number: number;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
  requires_acceptance: boolean;
  created_at: string;
  updated_at: string;
}

export function toLegalDocumentDto(row: LegalDocumentRow): LegalDocumentDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    documentType: row.document_type,
    documentCode: row.document_code,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    contentBody: row.content_body,
    languageCode: row.language_code,
    versionNumber: row.version_number,
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    requiresAcceptance: row.requires_acceptance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Scope lookup for FK verification during legal_acceptance creation.
 */
export interface LegalDocumentScopeRow {
  id: string;
  organization_id: string;
  status: string;
  content_body: string;
  effective_from: string | null;
  effective_to: string | null;
}
