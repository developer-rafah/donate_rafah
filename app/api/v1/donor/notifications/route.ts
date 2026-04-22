/**
 * GET /api/v1/donor/notifications
 *
 * Lists notifications addressed to the authenticated user.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { listDonorNotifications } from "@services/donor/notifications.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorNotifications(ctx);
  return ok(data);
});
