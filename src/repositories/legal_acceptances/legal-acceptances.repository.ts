import "server-only";

/**
 * Legal acceptances repository.
 *
 * Read + append-only create. Org-scoped via `.in("organization_id", orgIds)`.
 * The service verifies the referenced legal_document_id belongs to a
 * caller org before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { LegalAcceptanceRow } from "@modules/legal/legal-acceptances.dto";

const TABLE = "legal_acceptances";

const SELECT_COLUMNS =
  "id, organization_id, legal_document_id, user_id, donor_id, accepted_at, " +
  "source_channel, ip_address, user_agent, acceptance_text_snapshot, created_at";

export async function listInOrgs(orgIds: string[]): Promise<LegalAcceptanceRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("accepted_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list legal acceptances", error);
  return (data ?? []) as unknown as LegalAcceptanceRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<LegalAcceptanceRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load legal acceptance", error);
  return (data as unknown as LegalAcceptanceRow) ?? null;
}

export interface CreateLegalAcceptanceDbInput {
  organization_id: string;
  legal_document_id: string;
  user_id: string | null;
  donor_id: string | null;
  accepted_at: string;
  source_channel: string | null;
  ip_address: string | null;
  user_agent: string | null;
  acceptance_text_snapshot: string | null;
}

export async function create(
  input: CreateLegalAcceptanceDbInput
): Promise<LegalAcceptanceRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create legal acceptance", error);
  return data as unknown as LegalAcceptanceRow;
}
