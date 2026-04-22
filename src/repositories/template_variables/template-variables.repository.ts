import "server-only";

/**
 * Template variables repository.
 *
 * Scoped by parent `template_id`. Service verifies the parent template
 * belongs to the caller's orgs before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { TemplateVariableRow } from "@modules/comms/template-versions.dto";

const TABLE = "template_variables";

const SELECT_COLUMNS =
  "id, template_id, variable_key, variable_label_ar, variable_label_en, " +
  "variable_type, sample_value, is_required, created_at, updated_at";

export async function listByTemplateId(
  templateId: string
): Promise<TemplateVariableRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("template_id", templateId)
    .order("variable_key", { ascending: true });

  if (error) throw new DependencyError("Failed to list template variables", error);
  return (data ?? []) as unknown as TemplateVariableRow[];
}
