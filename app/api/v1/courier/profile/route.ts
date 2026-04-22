/**
 * GET /api/v1/courier/profile
 *
 * Returns the authenticated courier's profile view.
 */

import { ok } from "@lib/http/response";
import { withCourierHandler } from "@lib/auth";
import { getCourierProfile } from "@services/courier/profile.service";

export const dynamic = "force-dynamic";

export const GET = withCourierHandler(async (_req, ctx) => {
  const data = await getCourierProfile(ctx);
  return ok(data);
});
