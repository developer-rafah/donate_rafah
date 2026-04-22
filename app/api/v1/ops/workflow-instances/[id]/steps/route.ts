/**
 * GET /api/v1/ops/workflow-instances/[id]/steps
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { listStepInstancesForInstance } from "@services/workflow/step-instances.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listStepInstancesForInstance(ctx, id);
  return ok(data);
});
