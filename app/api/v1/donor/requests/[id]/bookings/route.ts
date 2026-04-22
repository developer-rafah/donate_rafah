/**
 * GET /api/v1/donor/requests/[id]/bookings
 *
 * Read-only list of bookings tied to a donor-owned request.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireDonor } from "@lib/auth";
import { listDonorBookingsForRequest } from "@services/donor/bookings.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireDonor();
  const data = await listDonorBookingsForRequest(ctx, id);
  return ok(data);
});
