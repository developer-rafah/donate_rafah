/**
 * POST /api/v1/webhooks/[providerKey]
 *
 * Public, UNAUTHENTICATED webhook receiver. The handler:
 *   - uses `withErrorHandling` only (no auth wrapper).
 *   - resolves the `[providerKey]` URL segment to an active
 *     integration_providers row. Zero matches → 404. Multiple
 *     matches (ambiguous multi-tenant) → 409.
 *   - captures the raw body + redacted headers into a new
 *     `webhook_events` row with `processing_status = "pending"`.
 *   - does NOT run downstream business logic, send notifications, or
 *     mutate unrelated entities. That's the provider-execution
 *     phase's job.
 *   - does NOT verify HMAC/signatures — the schema does not provide a
 *     dedicated secret column and the `config_payload_json` shape is
 *     provider-specific. A later phase can validate and flip
 *     `processing_status`.
 *
 * Returns the stored event with the standard success envelope. The
 * receiver intentionally does not surface the full event DTO to avoid
 * leaking captured headers/body back to the caller (which may be an
 * untrusted third-party); only the event id + accepted flag are
 * returned.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { receiveWebhook } from "@services/integrations/webhook-receiver.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ providerKey: string }> };

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { providerKey } = await routeCtx.params;
  const event = await receiveWebhook(req, providerKey);
  return ok(
    { id: event.id, accepted: true },
    { status: 202 }
  );
});
