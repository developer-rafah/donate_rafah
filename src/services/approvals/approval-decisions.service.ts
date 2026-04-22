import "server-only";

/**
 * Approval decisions service.
 *
 * All operations start with the parent-request visibility gate. Writes
 * additionally enforce:
 *   - the chain has a currently-pending step (otherwise ConflictError)
 *   - if the client supplied `approval_chain_step_id`, it matches the
 *     pending step
 *   - the caller is eligible for the pending step (role / user match)
 *   - the caller has not already decided on this step (idempotency —
 *     double-submission protection)
 *
 * Decisions are append-only: the service never UPDATEs or DELETEs rows.
 * Aggregating decisions into `approval_requests.request_status` /
 * `decision` / `reviewed_*` is workflow logic that belongs to a later
 * phase.
 */

import type { OpsAuthedContext } from "@lib/auth";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "@lib/errors";
import * as decisionsRepo from "@repositories/approval_decisions/approval-decisions.repository";
import { resolveChainForRequest } from "./chain-resolution.service";
import { assertRequestInCallerOrgs } from "./approval-requests.service";
import {
  hasCallerAlreadyDecided,
  isCallerEligibleForStep,
} from "@domain/approvals/rules";
import {
  toApprovalDecisionDto,
  type ApprovalDecisionDto,
  type CreateApprovalDecisionInput,
} from "@modules/approvals/approval-decisions.dto";

/**
 * Collect the caller's role ids within a specific organization. Used
 * for step-eligibility checks.
 */
function callerRoleIdsInOrg(
  ctx: OpsAuthedContext,
  organizationId: string
): string[] {
  const ids = ctx.memberships
    .filter((m) => m.organizationId === organizationId)
    .flatMap((m) => m.roles.map((r) => r.id));
  return Array.from(new Set(ids));
}

export async function listApprovalDecisions(
  ctx: OpsAuthedContext,
  approvalRequestId: string
): Promise<ApprovalDecisionDto[]> {
  await assertRequestInCallerOrgs(ctx, approvalRequestId);
  const rows = await decisionsRepo.listByRequestId(approvalRequestId);
  return rows.map(toApprovalDecisionDto);
}

export async function createApprovalDecision(
  ctx: OpsAuthedContext,
  approvalRequestId: string,
  input: CreateApprovalDecisionInput
): Promise<ApprovalDecisionDto> {
  const request = await assertRequestInCallerOrgs(ctx, approvalRequestId);

  const { pendingStep, decisions } = await resolveChainForRequest(request);

  if (!pendingStep) {
    // The chain is already satisfied — no more decisions needed.
    throw new ConflictError(
      "Approval request has no pending step awaiting a decision"
    );
  }

  // If the client supplied a step id, enforce it matches the resolved
  // pending step. Prevents out-of-order decisions.
  if (
    input.approval_chain_step_id &&
    input.approval_chain_step_id !== pendingStep.id
  ) {
    throw new ConflictError(
      "Supplied approval_chain_step_id does not match the currently-pending step"
    );
  }

  // Eligibility: caller must match the step's role / specific_user rule.
  const roleIds = callerRoleIdsInOrg(ctx, request.organization_id);
  const orgHasMembership = ctx.memberships.some(
    (m) => m.organizationId === request.organization_id
  );
  const eligible = isCallerEligibleForStep(
    pendingStep,
    ctx.user.id,
    roleIds,
    orgHasMembership
  );
  if (!eligible) {
    throw new ForbiddenError(
      "Caller is not eligible to decide on the pending step"
    );
  }

  // Idempotency: reject double-submissions by the same user on the
  // same step. CSV does not show a unique constraint so this is
  // enforced at the app layer.
  if (hasCallerAlreadyDecided(decisions, pendingStep.id, ctx.user.id)) {
    throw new ConflictError(
      "Caller has already recorded a decision on this step"
    );
  }

  if (input.decision_status.length === 0) {
    throw new BadRequestError("decision_status must not be empty");
  }

  const row = await decisionsRepo.create({
    approval_request_id: request.id,
    approval_chain_step_id: pendingStep.id,
    decision_by_user_id: ctx.user.id,
    decision_status: input.decision_status,
    decision_notes: input.decision_notes ?? null,
    decision_reason_ref_id: input.decision_reason_ref_id ?? null,
    decided_at: input.decided_at ?? new Date().toISOString(),
  });

  return toApprovalDecisionDto(row);
}
