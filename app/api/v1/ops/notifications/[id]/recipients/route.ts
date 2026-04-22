/**
 * GET  /api/v1/ops/notifications/[id]/recipients
 * POST /api/v1/ops/notifications/[id]/recipients
 *
 * Parent-notification ownership is verified in the service. `notification_id`
 * is taken from the route, `delivery_status` defaults to "pending" server-side.
 * Delivery outcome fields (`delivered_at`, `read_at`, `failure_reason`) are
 * NOT writable in this phase — those belong to the provider-execution phase.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listRecipientsForNotification,
  createRecipientForNotification,
} from "@services/comms/notification-recipients.service";
import { createOpsNotificationRecipientSchema } from "@modules/comms/notification-recipients.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listRecipientsForNotification(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createOpsNotificationRecipientSchema);
  const data = await createRecipientForNotification(ctx, id, input);
  return ok(data, { status: 201 });
});
