/**
 * GET /api/v1/ops/communication-campaigns/[id]/deliveries
 *
 * Read-only. Deliveries are produced by the provider-execution layer
 * in a later phase; this phase only exposes them for inspection.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { listDeliveriesForCampaign } from "@services/comms/campaign-deliveries.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listDeliveriesForCampaign(ctx, id);
  return ok(data);
});
