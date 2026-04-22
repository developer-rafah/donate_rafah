import "server-only";

/**
 * Workflow transition rules repository.
 *
 * Read-only — exposes "find active outgoing transitions from a step"
 * ordered by priority_order. No user-facing CRUD in this phase.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WorkflowTransitionRuleRow } from "@modules/workflow/transition-rules.dto";

const TABLE = "workflow_transition_rules";

const SELECT_COLUMNS =
  "id, workflow_template_id, from_step_id, to_step_id, rule_name, " +
  "condition_type, condition_payload_json, on_success_action_json, " +
  "on_failure_action_json, is_active, priority_order";

export async function listActiveOutgoing(args: {
  workflowTemplateId: string;
  fromStepId: string;
}): Promise<WorkflowTransitionRuleRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("workflow_template_id", args.workflowTemplateId)
    .eq("from_step_id", args.fromStepId)
    .eq("is_active", true)
    .order("priority_order", { ascending: true });

  if (error) throw new DependencyError("Failed to list transition rules", error);
  return (data ?? []) as unknown as WorkflowTransitionRuleRow[];
}
