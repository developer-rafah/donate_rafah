/**
 * GET /api/v1/donor/profile
 *
 * Returns the authenticated donor's profile view.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { getDonorProfile } from "@services/donor/profile.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await getDonorProfile(ctx);
  return ok(data);
});
