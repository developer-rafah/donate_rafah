/**
 * GET  /api/v1/donor/requests/[id]/details  — list detail lines
 * POST /api/v1/donor/requests/[id]/details  — add a detail line
 *
 * Both operations verify the parent request is owned by the caller (via
 * the requests service). Returns NOT_FOUND for missing or foreign-owned
 * parent requests.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireDonor } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDonorRequestDetails,
  createDonorRequestDetail,
} from "@services/donor/request-details.service";
import { createDonationRequestDetailSchema } from "@modules/donor/request-details.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireDonor();
  const data = await listDonorRequestDetails(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireDonor();
  const input = await parseJsonBody(req, createDonationRequestDetailSchema);
  const data = await createDonorRequestDetail(ctx, id, input);
  return ok(data, { status: 201 });
});
