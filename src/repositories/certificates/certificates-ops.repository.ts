import "server-only";

/**
 * Certificates — ops-side reads on `certificate_templates` and
 * `issued_certificates`, plus issue-write.
 *
 * Sibling of the donor-facing `certificates.repository.ts`.
 * Certificate rules have their own repository file.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type {
  OpsCertificateTemplateRow,
  OpsIssuedCertificateRow,
} from "@modules/recognition/certificates.dto";

const TEMPLATES_TABLE = "certificate_templates";
const ISSUED_TABLE = "issued_certificates";

const TEMPLATE_COLUMNS =
  "id, organization_id, template_code, name_ar, name_en, description, " +
  "layout_type, template_content_json, background_attachment_id, " +
  "font_config_json, is_active, version_number, created_at, updated_at";

const ISSUED_COLUMNS =
  "id, organization_id, certificate_template_id, certificate_rule_id, " +
  "donor_id, source_entity_type, source_entity_id, certificate_number, " +
  "issue_status, issued_at, issued_by, pdf_attachment_id, verification_code, " +
  "metadata_json, created_at, updated_at";

// ---- Templates --------------------------------------------------------------

export async function listTemplatesInOrgs(
  orgIds: string[]
): Promise<OpsCertificateTemplateRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select(TEMPLATE_COLUMNS)
    .in("organization_id", orgIds)
    .order("template_code", { ascending: true });

  if (error) throw new DependencyError("Failed to list certificate templates", error);
  return (data ?? []) as unknown as OpsCertificateTemplateRow[];
}

export async function findTemplateByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<OpsCertificateTemplateRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select(TEMPLATE_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load certificate template", error);
  return (data as unknown as OpsCertificateTemplateRow) ?? null;
}

/**
 * Minimal scope lookup — used when verifying a template referenced
 * from an issuance POST belongs to the caller's orgs.
 */
export interface CertificateTemplateScopeRow {
  id: string;
  organization_id: string;
  is_active: boolean;
}

export async function findTemplateScopeById(
  id: string
): Promise<CertificateTemplateScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select("id, organization_id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load template scope", error);
  return (data as unknown as CertificateTemplateScopeRow) ?? null;
}

// ---- Issued certificates ---------------------------------------------------

export async function listIssuedByDonorId(
  donorId: string
): Promise<OpsIssuedCertificateRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(ISSUED_TABLE)
    .select(ISSUED_COLUMNS)
    .eq("donor_id", donorId)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list donor certificates", error);
  return (data ?? []) as unknown as OpsIssuedCertificateRow[];
}

export interface CreateIssuedCertificateDbInput {
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
  metadata_json: Record<string, unknown>;
  created_by: string | null;
}

export async function createIssued(
  input: CreateIssuedCertificateDbInput
): Promise<OpsIssuedCertificateRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(ISSUED_TABLE)
    .insert(input)
    .select(ISSUED_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create issued certificate", error);
  return data as unknown as OpsIssuedCertificateRow;
}
