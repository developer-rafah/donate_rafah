/**
 * Workflow transition rules — internal types.
 *
 * Aligned to `public.workflow_transition_rules`. Used by the resolver
 * only; no user-facing endpoint in this phase.
 */

export interface WorkflowTransitionRuleRow {
  id: string;
  workflow_template_id: string;
  from_step_id: string;
  to_step_id: string;
  rule_name: string;
  condition_type: string;
  condition_payload_json: Record<string, unknown> | null;
  on_success_action_json: Record<string, unknown> | null;
  on_failure_action_json: Record<string, unknown> | null;
  is_active: boolean;
  priority_order: number;
}
