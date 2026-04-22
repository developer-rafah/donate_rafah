/**
 * GET /api/v1/ops/webhook-events
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listWebhookEvents } from "@services/integrations/webhook-events.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listWebhookEvents(ctx);
  return ok(data);
});
