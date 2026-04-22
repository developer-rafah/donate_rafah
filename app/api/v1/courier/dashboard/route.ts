/**
 * GET /api/v1/courier/dashboard
 *
 * Aggregated courier summary.
 */

import { ok } from "@lib/http/response";
import { withCourierHandler } from "@lib/auth";
import { getCourierDashboard } from "@services/courier/dashboard.service";

export const dynamic = "force-dynamic";

export const GET = withCourierHandler(async (_req, ctx) => {
  const data = await getCourierDashboard(ctx);
  return ok(data);
});
