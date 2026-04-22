import "server-only";

/**
 * Template types repository — ops-side reads.
 *
 * Org-scoped via `.in("organization_id", orgIds)`.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { TemplateTypeRow } from "@modules/comms/template-types.dto";

const TABLE = "template_types";

const SELECT_COLUMNS =
  "id, organization_id, code, name_ar, name_en, description, " +
  "supported_channels_json, is_active, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<TemplateTypeRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("code", { ascending: true });

  if (error) throw new DependencyError("Failed to list template types", error);
  return (data ?? []) as unknown as TemplateTypeRow[];
}
