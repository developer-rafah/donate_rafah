/**
 * GET  /api/v1/ops/approval-requests
 * POST /api/v1/ops/approval-requests
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listApprovalRequests,
  createApprovalRequest,
} from "@services/approvals/approval-requests.service";
import { createApprovalRequestSchema } from "@modules/approvals/approval-requests.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listApprovalRequests(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createApprovalRequestSchema);
  const data = await createApprovalRequest(ctx, input);
  return ok(data, { status: 201 });
});
