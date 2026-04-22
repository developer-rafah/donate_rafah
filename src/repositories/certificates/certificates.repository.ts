import "server-only";

/**
 * Issued certificates repository — donor-scoped reads.
 *
 * Real schema:
 *   public.issued_certificates (
 *     id, organization_id, certificate_template_id, certificate_rule_id,
 *     donor_id, source_entity_type, source_entity_id,
 *     certificate_number, issue_status, issued_at, issued_by,
 *     pdf_attachment_id, verification_code, metadata_json,
 *     created_at, updated_at, created_by, updated_by
 *   )
 *   public.certificate_templates (
 *     id, organization_id, template_code, name_ar, name_en, description,
 *     layout_type, template_content_json, background_attachment_id,
 *     font_config_json, is_active, version_number,
 *     created_at, updated_at, created_by, updated_by
 *   )
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorCertificateRow } from "@modules/donor/recognition.dto";

const TABLE = "issued_certificates";

export async function listByDonorId(donorId: string): Promise<DonorCertificateRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
        id,
        donor_id,
        certificate_number,
        issue_status,
        issued_at,
        verification_code,
        pdf_attachment_id,
        certificate_templates ( id, template_code, name_ar, name_en )
      `
    )
    .eq("donor_id", donorId)
    .order("issued_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new DependencyError("Failed to list issued certificates for donor", error);
  }
  return (data ?? []) as unknown as DonorCertificateRow[];
}

export async function countByDonorId(donorId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("donor_id", donorId);

  if (error) {
    throw new DependencyError("Failed to count issued certificates for donor", error);
  }
  return count ?? 0;
}
