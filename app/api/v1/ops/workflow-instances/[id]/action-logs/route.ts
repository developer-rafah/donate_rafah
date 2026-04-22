/**
 * GET /api/v1/ops/workflow-instances/[id]/action-logs
 *
 * Read-only history; writes happen via the advance flow.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { listActionLogsForInstance } from "@services/workflow/action-logs.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listActionLogsForInstance(ctx, id);
  return ok(data);
});
