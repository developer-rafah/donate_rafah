/**
 * GET /api/v1/ops/legal-acceptances/[id]
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { getLegalAcceptance } from "@services/legal/legal-acceptances.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getLegalAcceptance(ctx, id);
  return ok(data);
});
