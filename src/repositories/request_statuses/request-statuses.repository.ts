import "server-only";

/**
 * Request statuses repository.
 *
 * Real schema (from the canonical CSV reference):
 *   public.request_statuses (
 *     id, organization_id, code, name_ar, name_en, description,
 *     status_group, color_code, icon_name, is_initial, is_terminal,
 *     is_active, sort_order, created_at, updated_at, created_by, updated_by
 *   )
 *   UNIQUE (organization_id, code)
 *   UNIQUE implied for is_initial per-org by business rule
 *
 * Every lookup is org-scoped — a global `code` lookup is ambiguous because
 * the same code can exist in multiple organizations.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";

const TABLE = "request_statuses";

interface RequestStatusRow {
  id: string;
  code: string;
  is_initial: boolean;
}

/**
 * Find a status by (organization, code). Returns null if not found.
 */
export async function findByOrgAndCode(
  organizationId: string,
  code: string
): Promise<RequestStatusRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, code, is_initial")
    .eq("organization_id", organizationId)
    .eq("code", code)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load request status by code", error);
  return (data as unknown as RequestStatusRow) ?? null;
}

/**
 * Find the initial status for an organization. Picks the first row when
 * multiple are flagged, though the business rule is one-per-org.
 */
export async function findInitialForOrg(
  organizationId: string
): Promise<RequestStatusRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, code, is_initial")
    .eq("organization_id", organizationId)
    .eq("is_initial", true)
    .limit(1)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load initial request status", error);
  return (data as unknown as RequestStatusRow) ?? null;
}
