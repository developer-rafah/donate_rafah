import "server-only";

/**
 * Template versions repository.
 *
 * Scoped by parent `template_id`. Point-read (`findById`) joins via the
 * parent template's org so we can cross-check the caller's org set
 * without a second query.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { TemplateVersionRow } from "@modules/comms/template-versions.dto";

const TABLE = "template_versions";

const SELECT_COLUMNS =
  "id, template_id, version_number, subject_text, body_content, body_format, " +
  "variables_json, status, published_at, created_at, created_by";

export async function listByTemplateId(
  templateId: string
): Promise<TemplateVersionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("template_id", templateId)
    .order("version_number", { ascending: false });

  if (error) throw new DependencyError("Failed to list template versions", error);
  return (data ?? []) as unknown as TemplateVersionRow[];
}

/**
 * Find a version by id and simultaneously enforce that the parent
 * template is in the caller's org set via a PostgREST inner join.
 * Returns null when either the version is missing OR the parent
 * template is not in the caller's orgs.
 */
export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<TemplateVersionRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(`${SELECT_COLUMNS}, templates!inner(organization_id)`)
    .eq("id", id)
    .in("templates.organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load template version", error);
  if (!data) return null;

  // Strip the embedded template from the returned row.
  const { templates: _drop, ...rest } = data as TemplateVersionRow & {
    templates?: unknown;
  };
  return rest as TemplateVersionRow;
}
