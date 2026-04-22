/**
 * Domain — Approvals.
 *
 * Pure business rules for next-approver resolution and decision
 * eligibility. Framework-free, no DB access — consumed by the services
 * after they load the relevant rows from the repositories.
 */

import type {
  ApprovalChainStepRow,
} from "@modules/approvals/approval-chains.dto";
import type { ApprovalDecisionRow } from "@modules/approvals/approval-decisions.dto";

/**
 * Status code a step decision must have to count as "approved".
 *
 * ASSUMPTION: `"approved"` is the canonical approved status. The CSV
 * schema does not expose a check constraint for `decision_status`. If
 * the org uses a different code ("accepted", "granted"), change this
 * constant — single-point edit.
 */
export const APPROVED_DECISION_STATUS = "approved";

/**
 * Default `request_status` for newly-created approval requests.
 * ASSUMPTION: same rationale as above.
 */
export const APPROVAL_REQUEST_DEFAULT_STATUS = "pending";

/**
 * Pick the step that is currently pending a decision.
 *
 * Iterates steps in `step_order` ascending. For each step:
 *   - if the step is `is_required = true` and has no approved decision,
 *     it's the pending step.
 *   - if the step is non-required, skip it regardless of decisions.
 *
 * Returns `null` when every required step already has an approved
 * decision — i.e. the chain is effectively satisfied.
 */
export function pickNextPendingStep(
  steps: ApprovalChainStepRow[],
  decisions: ApprovalDecisionRow[]
): ApprovalChainStepRow | null {
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);
  const approvedStepIds = new Set(
    decisions
      .filter((d) => d.decision_status === APPROVED_DECISION_STATUS)
      .map((d) => d.approval_chain_step_id)
  );

  for (const step of sorted) {
    if (!step.is_required) continue;
    if (approvedStepIds.has(step.id)) continue;
    return step;
  }
  return null;
}

/**
 * Check whether the caller is eligible to decide on a given step.
 *
 * Eligibility rules (in order):
 *   1. If `specific_user_id` is set, only that user is eligible.
 *   2. Else if `role_id` is set, the caller must hold that role via an
 *      active membership in the request's organization.
 *   3. Else (both null) — the step is open to any internal ops member
 *      of the request's organization.
 *
 * `callerRoleIds` is the set of role ids the caller holds in the
 * relevant organization. `callerOrgHasMembership` is `true` iff the
 * caller has ANY membership in that org (pre-checked by the service).
 */
export function isCallerEligibleForStep(
  step: Pick<ApprovalChainStepRow, "role_id" | "specific_user_id">,
  callerUserId: string,
  callerRoleIds: string[],
  callerOrgHasMembership: boolean
): boolean {
  if (step.specific_user_id !== null) {
    return step.specific_user_id === callerUserId;
  }
  if (step.role_id !== null) {
    return callerRoleIds.includes(step.role_id);
  }
  return callerOrgHasMembership;
}

/**
 * Detect an already-recorded decision by the caller on the same step —
 * used for idempotency / double-submission protection. CSV does not
 * show a unique constraint on `(request, step, user)`, so the service
 * enforces "one decision per (request, step, user)" in application code.
 */
export function hasCallerAlreadyDecided(
  decisions: ApprovalDecisionRow[],
  stepId: string,
  userId: string
): boolean {
  return decisions.some(
    (d) => d.approval_chain_step_id === stepId && d.decision_by_user_id === userId
  );
}
