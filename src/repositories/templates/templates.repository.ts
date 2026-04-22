import "server-only";

/**
 * Templates repository — ops-side reads.
 *
 * Org-scoped directly via `organization_id`. Also exposes
 * `findScopeById` for child-resource gating (template_versions,
 * template_variables, notifications/campaigns referencing a template).
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { TemplateRow, TemplateScopeRow } from "@modules/comms/templates.dto";

const TABLE = "templates";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, template_type_id, template_code, " +
  "name_ar, name_en, language_code, current_version_number, status, " +
  "is_default, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<TemplateRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list templates", error);
  return (data ?? []) as unknown as TemplateRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<TemplateRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load template", error);
  return (data as unknown as TemplateRow) ?? null;
}

/**
 * Scope lookup used by child resources — returns just id + org_id.
 */
export async function findScopeById(id: string): Promise<TemplateScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load template scope", error);
  return (data as unknown as TemplateScopeRow) ?? null;
}
