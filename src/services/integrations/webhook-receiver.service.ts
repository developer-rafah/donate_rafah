import "server-only";

/**
 * Webhook receiver service.
 *
 * Unauthenticated endpoint surface. The receiver:
 *   1. Resolves `providerKey` → a single active integration_providers
 *      row. Zero matches → NotFound. Multiple matches (ambiguous
 *      multi-tenant) → Conflict; operators must use org-prefixed
 *      provider codes to disambiguate. No client-supplied org hints
 *      are trusted because there is no auth.
 *   2. Parses the request body as JSON. Non-JSON bodies are stored
 *      as `{"_raw": "<text>"}` so the row shape stays stable (NOT NULL
 *      on request_body_json).
 *   3. Serializes request headers, redacting sensitive ones.
 *   4. Picks `event_type` + `external_event_id` from well-known
 *      top-level keys when present; otherwise falls back to constants.
 *   5. Inserts an append-only `webhook_events` row with
 *      `processing_status = "pending"`. No downstream business logic
 *      runs in this phase — the provider-execution layer owns
 *      processing.
 *
 * Signature/HMAC verification is NOT performed here. The schema has
 * no dedicated webhook-secret column on providers, and
 * `integration_configurations.config_payload_json` is too loose to
 * ground provider-specific validation in a safe generic way. Events
 * are captured as received; a later phase can validate and update
 * `processing_status`.
 */

import {
  ConflictError,
  DependencyError,
  NotFoundError,
} from "@lib/errors";

import * as eventsRepo from "@repositories/webhook_events/webhook-events.repository";
import * as providersRepo from "@repositories/integration_providers/integration-providers.repository";

import {
  WEBHOOK_EVENT_DIRECTION_INBOUND,
  WEBHOOK_PROCESSING_STATUS_PENDING,
  resolveEventTypeFromBody,
  resolveExternalEventIdFromBody,
  serializeRequestHeaders,
} from "@domain/integrations/rules";
import {
  toWebhookEventDto,
  type WebhookEventDto,
} from "@modules/integrations/logs.dto";

/**
 * Parse a raw request body into a JSON-safe object. The receiver must
 * still store *something* when the provider sends non-JSON, since
 * `request_body_json` is NOT NULL in DB.
 */
async function parseRequestBody(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length === 0) return {};

  try {
    const parsed = JSON.parse(text);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    // JSON scalars / arrays → wrap so the row shape stays object-typed.
    return { _value: parsed };
  } catch {
    return { _raw: text.slice(0, 1_000_000) };
  }
}

export async function receiveWebhook(
  req: Request,
  providerKey: string
): Promise<WebhookEventDto> {
  // Step 1: resolve provider_code to a single active provider row.
  const candidates = await providersRepo.listActiveByProviderCode(providerKey);
  if (candidates.length === 0) {
    throw new NotFoundError("Integration provider not found for providerKey");
  }
  if (candidates.length > 1) {
    // Multi-tenant ambiguity — operators must use org-prefixed codes.
    throw new ConflictError(
      "providerKey resolves to multiple active providers across orgs"
    );
  }

  const provider = candidates[0];
  // noUncheckedIndexedAccess — narrow the optional back to a concrete value.
  if (!provider) {
    throw new DependencyError("Provider lookup returned an empty row");
  }

  // Step 2 + 3: capture body + headers.
  const body = await parseRequestBody(req);
  const headers = serializeRequestHeaders(req.headers);

  // Step 4: infer event discriminator fields from the parsed body.
  const eventType = resolveEventTypeFromBody(body);
  const externalEventId = resolveExternalEventIdFromBody(body);

  // Step 5: append-only insert.
  const row = await eventsRepo.create({
    organization_id: provider.organization_id,
    provider_id: provider.id,
    event_direction: WEBHOOK_EVENT_DIRECTION_INBOUND,
    event_type: eventType,
    external_event_id: externalEventId,
    request_headers_json: headers,
    request_body_json: body,
    // NOT NULL in DB; the receiver itself produces no response payload
    // beyond the standard envelope returned by the route handler.
    response_body_json: {},
    processing_status: WEBHOOK_PROCESSING_STATUS_PENDING,
  });

  return toWebhookEventDto(row);
}
