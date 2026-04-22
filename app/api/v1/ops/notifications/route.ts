/**
 * GET  /api/v1/ops/notifications
 * POST /api/v1/ops/notifications
 *
 * Writes DB rows only — no external delivery side effects.
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listOpsNotifications,
  createOpsNotification,
} from "@services/comms/notifications.service";
import { createOpsNotificationSchema } from "@modules/comms/notifications.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listOpsNotifications(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createOpsNotificationSchema);
  const data = await createOpsNotification(ctx, input);
  return ok(data, { status: 201 });
});
