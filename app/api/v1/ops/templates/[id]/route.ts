/**
 * GET /api/v1/ops/templates/[id]
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { getTemplate } from "@services/comms/templates.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getTemplate(ctx, id);
  return ok(data);
});
