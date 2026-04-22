import "server-only";

/**
 * Workflow steps repository.
 *
 * Read-only — exposes list-by-template and find-initial for instance
 * creation. Steps are not user-modifiable in this phase.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WorkflowStepRow } from "@modules/workflow/steps.dto";

const TABLE = "workflow_steps";

const SELECT_COLUMNS =
  "id, workflow_template_id, step_code, name_ar, name_en, step_type, " +
  "sort_order, assigned_role_id, is_required, is_initial, is_terminal, " +
  "auto_start, auto_complete, sla_hours, settings_json";

export async function listByTemplateId(templateId: string): Promise<WorkflowStepRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("workflow_template_id", templateId)
    .order("sort_order", { ascending: true });

  if (error) throw new DependencyError("Failed to list workflow steps", error);
  return (data ?? []) as unknown as WorkflowStepRow[];
}

/**
 * Find the initial step of a template. When multiple rows are flagged
 * is_initial, picks the one with the lowest sort_order.
 */
export async function findInitialStep(
  templateId: string
): Promise<WorkflowStepRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("workflow_template_id", templateId)
    .eq("is_initial", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load initial step", error);
  return (data as unknown as WorkflowStepRow) ?? null;
}
