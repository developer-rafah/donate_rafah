/**
 * Domain — Workflow.
 *
 * Pure business rules for workflow progression. Framework-free, no DB
 * access — the services load rows from the repositories and pass them in.
 */

import type { WorkflowStepRow } from "@modules/workflow/steps.dto";
import type { WorkflowTransitionRuleRow } from "@modules/workflow/transition-rules.dto";
import type { WorkflowInstanceRow } from "@modules/workflow/instances.dto";

/**
 * Default instance status on creation.
 *
 * ASSUMPTION: `"active"` is the canonical running status. CSV has no
 * visible check constraint on `workflow_instances.instance_status`;
 * single constant for easy adjustment.
 */
export const WORKFLOW_INSTANCE_DEFAULT_STATUS = "active";

/**
 * Completed / cancelled terminal statuses for the instance. Used by the
 * advance guard to reject progression on already-finished instances.
 */
export const WORKFLOW_INSTANCE_COMPLETED_STATUS = "completed";
export const WORKFLOW_INSTANCE_CANCELLED_STATUS = "cancelled";

/**
 * Default status assigned to a newly-created step instance. ASSUMPTION:
 * `"active"` matches the instance-level default.
 */
export const WORKFLOW_STEP_INSTANCE_DEFAULT_STATUS = "active";

/**
 * Status used when completing a step instance during advancement.
 */
export const WORKFLOW_STEP_INSTANCE_COMPLETED_STATUS = "completed";

/**
 * An instance is "terminal" when any terminal timestamp is set.
 * Terminal instances cannot be advanced.
 */
export function isInstanceTerminal(row: WorkflowInstanceRow): boolean {
  return row.completed_at !== null || row.cancelled_at !== null;
}

/**
 * Given the set of active outgoing transitions from the current step and
 * an optional client-supplied `transition_rule_id`, pick the transition
 * to apply.
 *
 * Rules:
 *   - if the client supplied an id, it MUST match one of the active
 *     outgoing transitions; otherwise the caller throws.
 *   - if no client id and exactly one active transition exists, use it.
 *   - if no client id and multiple transitions exist, the caller must
 *     disambiguate → null (the caller turns this into a CONFLICT).
 *   - if no active transitions exist → null (caller throws CONFLICT).
 */
export function pickTransition(
  activeOutgoing: WorkflowTransitionRuleRow[],
  requestedRuleId: string | null | undefined
): WorkflowTransitionRuleRow | null {
  if (activeOutgoing.length === 0) return null;

  if (requestedRuleId) {
    const match = activeOutgoing.find((t) => t.id === requestedRuleId);
    return match ?? null;
  }

  const sorted = [...activeOutgoing].sort(
    (a, b) => a.priority_order - b.priority_order
  );
  if (sorted.length === 1) return sorted[0] ?? null;
  return null;
}

/**
 * Look up a step row by id in a list. Small helper to keep services
 * clean when they need the destination step's properties
 * (`is_terminal`, `assigned_role_id`) after picking a transition.
 */
export function findStepById(
  steps: WorkflowStepRow[],
  stepId: string
): WorkflowStepRow | null {
  return steps.find((s) => s.id === stepId) ?? null;
}
