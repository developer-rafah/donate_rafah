/**
 * GET /api/v1/ops/donors/[donorId]/points-ledger
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { listDonorPointsLedger } from "@services/recognition/points.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ donorId: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { donorId } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listDonorPointsLedger(ctx, donorId);
  return ok(data);
});
