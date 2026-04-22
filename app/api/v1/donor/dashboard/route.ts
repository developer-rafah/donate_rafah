/**
 * GET /api/v1/donor/dashboard
 *
 * Aggregated summary for the donor landing screen.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { getDonorDashboard } from "@services/donor/dashboard.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await getDonorDashboard(ctx);
  return ok(data);
});
