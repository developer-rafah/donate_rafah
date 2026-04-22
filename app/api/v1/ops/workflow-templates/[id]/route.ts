/**
 * GET /api/v1/ops/workflow-templates/[id]
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { getWorkflowTemplate } from "@services/workflow/templates.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getWorkflowTemplate(ctx, id);
  return ok(data);
});
