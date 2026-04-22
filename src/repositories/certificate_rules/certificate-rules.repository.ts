import "server-only";

/**
 * Certificate rules repository — ops-side reads.
 *
 * Org-scoped via `.in("organization_id", orgIds)`.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CertificateRuleRow } from "@modules/recognition/certificates.dto";

const TABLE = "certificate_rules";

const SELECT_COLUMNS =
  "id, organization_id, rule_code, name_ar, name_en, description, " +
  "certificate_template_id, trigger_event_code, entity_type, " +
  "condition_payload_json, issue_mode, is_active, start_at, end_at, " +
  "created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<CertificateRuleRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("rule_code", { ascending: true });

  if (error) throw new DependencyError("Failed to list certificate rules", error);
  return (data ?? []) as unknown as CertificateRuleRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<CertificateRuleRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load certificate rule", error);
  return (data as unknown as CertificateRuleRow) ?? null;
}

/**
 * Scope lookup for FK verification during issuance — ensures the rule
 * belongs to one of the caller's orgs AND matches the template in use.
 */
export interface CertificateRuleScopeRow {
  id: string;
  organization_id: string;
  certificate_template_id: string;
  is_active: boolean;
}

export async function findScopeById(
  id: string
): Promise<CertificateRuleScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, certificate_template_id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load rule scope", error);
  return (data as unknown as CertificateRuleScopeRow) ?? null;
}
