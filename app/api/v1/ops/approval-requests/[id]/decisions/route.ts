/**
 * GET  /api/v1/ops/approval-requests/[id]/decisions
 * POST /api/v1/ops/approval-requests/[id]/decisions
 *
 * `approval_request_id` is taken from the route. `decision_by_user_id`,
 * `approval_chain_step_id` (when the pending step is known), and
 * `decided_at` (when omitted) are derived server-side. Append-only.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listApprovalDecisions,
  createApprovalDecision,
} from "@services/approvals/approval-decisions.service";
import { createApprovalDecisionSchema } from "@modules/approvals/approval-decisions.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listApprovalDecisions(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createApprovalDecisionSchema);
  const data = await createApprovalDecision(ctx, id, input);
  return ok(data, { status: 201 });
});
