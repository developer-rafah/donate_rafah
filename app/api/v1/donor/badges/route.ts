/**
 * GET /api/v1/donor/badges
 *
 * Lists badge awards for the donor, newest first.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { listDonorBadges } from "@services/donor/recognition.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorBadges(ctx);
  return ok(data);
});
