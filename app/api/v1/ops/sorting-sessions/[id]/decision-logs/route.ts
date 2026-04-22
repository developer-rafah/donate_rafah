/**
 * GET  /api/v1/ops/sorting-sessions/[id]/decision-logs
 * POST /api/v1/ops/sorting-sessions/[id]/decision-logs
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDecisionLogsForSession,
  createDecisionLogForSession,
} from "@services/ops/decision-logs.service";
import { createDecisionLogSchema } from "@modules/ops/decision-logs.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listDecisionLogsForSession(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createDecisionLogSchema);
  const data = await createDecisionLogForSession(ctx, id, input);
  return ok(data, { status: 201 });
});
