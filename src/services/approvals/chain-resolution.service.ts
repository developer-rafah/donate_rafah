import "server-only";

/**
 * Approval chain resolution helper.
 *
 * Given an approval request, find the governing chain, its ordered
 * steps, and the currently-pending step (given the decision history).
 * This is the only place that knows how to stitch the four tables
 * together — services call in here instead of re-implementing the
 * lookup.
 */

import { DependencyError } from "@lib/errors";
import * as chainsRepo from "@repositories/approval_chains/approval-chains.repository";
import * as stepsRepo from "@repositories/approval_chain_steps/approval-chain-steps.repository";
import * as decisionsRepo from "@repositories/approval_decisions/approval-decisions.repository";
import type { ApprovalRequestRow } from "@modules/approvals/approval-requests.dto";
import type {
  ApprovalChainScopeRow,
  ApprovalChainStepRow,
} from "@modules/approvals/approval-chains.dto";
import type { ApprovalDecisionRow } from "@modules/approvals/approval-decisions.dto";
import { pickNextPendingStep } from "@domain/approvals/rules";

export interface ChainResolution {
  chain: ApprovalChainScopeRow;
  steps: ApprovalChainStepRow[];
  decisions: ApprovalDecisionRow[];
  pendingStep: ApprovalChainStepRow | null;
}

/**
 * Resolve the chain + steps + decisions + currently-pending step for a
 * given approval request. Throws `DependencyError` when no governing
 * chain exists for the request's scope — that's a configuration
 * problem, not a user error, so it should surface as a 500.
 */
export async function resolveChainForRequest(
  request: ApprovalRequestRow
): Promise<ChainResolution> {
  const chain = await chainsRepo.findGoverningChain({
    organizationId: request.organization_id,
    approvalTypeId: request.approval_type_id,
    entityType: request.entity_type,
    branchId: request.branch_id,
  });
  if (!chain) {
    throw new DependencyError(
      "No active approval chain configured for this request's type + entity"
    );
  }

  const [steps, decisions] = await Promise.all([
    stepsRepo.listByChainId(chain.id),
    decisionsRepo.listByRequestId(request.id),
  ]);

  const pendingStep = pickNextPendingStep(steps, decisions);
  return { chain, steps, decisions, pendingStep };
}
