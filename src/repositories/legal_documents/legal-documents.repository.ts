import "server-only";

/**
 * Legal documents repository — read-only.
 *
 * Org-scoped via `.in("organization_id", orgIds)`. Also exposes a
 * scope lookup used by the acceptance-creation flow.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type {
  LegalDocumentRow,
  LegalDocumentScopeRow,
} from "@modules/legal/legal-documents.dto";

const TABLE = "legal_documents";

const SELECT_COLUMNS =
  "id, organization_id, document_type, document_code, title_ar, title_en, " +
  "content_body, language_code, version_number, status, effective_from, " +
  "effective_to, requires_acceptance, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<LegalDocumentRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list legal documents", error);
  return (data ?? []) as unknown as LegalDocumentRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<LegalDocumentRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load legal document", error);
  return (data as unknown as LegalDocumentRow) ?? null;
}

export async function findScopeById(
  id: string
): Promise<LegalDocumentScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id, organization_id, status, content_body, effective_from, effective_to"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load document scope", error);
  return (data as unknown as LegalDocumentScopeRow) ?? null;
}
