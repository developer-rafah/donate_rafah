/**
 * GET /api/v1/donor/requests/[id]
 *
 * Returns a single donation request owned by the caller. Returns NOT_FOUND
 * when the id does not exist or is owned by another donor (we never
 * distinguish the two cases externally).
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireDonor } from "@lib/auth";
import { getDonorRequest } from "@services/donor/requests.service";

export const dynamic = "force-dynamic";

// Next 15 App Router: `params` is a Promise and must be awaited.
type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireDonor();
  const data = await getDonorRequest(ctx, id);
  return ok(data);
});
