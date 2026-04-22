/**
 * Approval chains + chain steps — internal types used by the resolver.
 *
 * This phase does not expose CRUD for chains/steps. These types are
 * consumed by the resolution helpers that pick the next-pending step
 * for a given request.
 *
 * Aligned to:
 *   public.approval_chains(id, organization_id, approval_type_id,
 *                           entity_type, branch_id, is_default, is_active, ...)
 *   public.approval_chain_steps(id, approval_chain_id, step_order,
 *                                role_id, specific_user_id, decision_mode,
 *                                is_required, sla_hours, settings_json, ...)
 */

export interface ApprovalChainScopeRow {
  id: string;
  organization_id: string;
  approval_type_id: string;
  entity_type: string;
  branch_id: string | null;
  is_default: boolean;
  is_active: boolean;
}

export interface ApprovalChainStepRow {
  id: string;
  approval_chain_id: string;
  step_order: number;
  role_id: string | null;
  specific_user_id: string | null;
  decision_mode: string;
  is_required: boolean;
  sla_hours: number | null;
  settings_json: Record<string, unknown> | null;
}
