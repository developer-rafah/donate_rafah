/**
 * Domain — Integrations.
 *
 * Pure helpers and constants. Framework-free, no DB access.
 */

// ---- Webhook defaults -------------------------------------------------------

/**
 * ASSUMPTION: `"inbound"` is the canonical `event_direction` for
 * webhook receiver endpoints. CSV shows no visible check constraint
 * on `webhook_events.event_direction`. Single constant for adjustment.
 */
export const WEBHOOK_EVENT_DIRECTION_INBOUND = "inbound";

/**
 * ASSUMPTION: `"pending"` is the initial `processing_status` for a
 * freshly-received webhook. A later provider-execution phase is
 * responsible for flipping rows to `"processed"` or `"failed"`.
 */
export const WEBHOOK_PROCESSING_STATUS_PENDING = "pending";

/**
 * Default event_type when the inbound payload carries no obvious
 * event discriminator. The webhook receiver tries to pull the type
 * from common envelope keys (`event`, `event_type`, `type`) and falls
 * back to this constant.
 */
export const WEBHOOK_EVENT_TYPE_UNKNOWN = "unknown";

/**
 * Scan the (parsed) inbound body for a commonly-used event-type key.
 * Returns a string when a top-level string is found, otherwise the
 * fallback constant. Only inspects top-level keys — deep shape-
 * matching across providers is out of scope for this phase.
 */
export function resolveEventTypeFromBody(body: unknown): string {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return WEBHOOK_EVENT_TYPE_UNKNOWN;
  }
  const obj = body as Record<string, unknown>;
  for (const key of ["event", "event_type", "eventType", "type"]) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0 && val.length <= 200) {
      return val;
    }
  }
  return WEBHOOK_EVENT_TYPE_UNKNOWN;
}

/**
 * Scan the parsed body for a provider-supplied external id so we can
 * populate `webhook_events.external_event_id` for later reconciliation.
 * Only top-level keys.
 */
export function resolveExternalEventIdFromBody(body: unknown): string | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const obj = body as Record<string, unknown>;
  for (const key of ["id", "event_id", "eventId", "external_id"]) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0 && val.length <= 500) {
      return val;
    }
  }
  return null;
}

// ---- Config payload redaction ----------------------------------------------

/**
 * Top-level keys (case-insensitive) whose values are redacted before
 * returning `integration_configurations.config_payload_json` in a GET
 * response.
 *
 * ASSUMPTION: the schema stores the entire provider config as a
 * single JSONB blob (no dedicated secret column), so redaction is the
 * safest minimal pattern. Redaction is read-only; POST/PATCH accept
 * the full payload verbatim.
 *
 * This list is intentionally narrow — it targets common naming
 * conventions only. Nested structures are not walked because the
 * schema does not describe expected sub-shapes.
 */
const SECRET_KEYS = new Set([
  "secret",
  "api_key",
  "apikey",
  "token",
  "password",
  "private_key",
  "client_secret",
  "access_token",
  "refresh_token",
  "webhook_secret",
  "auth_token",
]);

export const REDACTED_PLACEHOLDER = "[REDACTED]";

export function redactConfigPayload(
  payload: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SECRET_KEYS.has(key.toLowerCase())) {
      redacted[key] = REDACTED_PLACEHOLDER;
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

// ---- Request header normalization ------------------------------------------

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "x-api-key",
  "x-auth-token",
  "x-webhook-secret",
]);

/**
 * Serialize the inbound request headers into a JSON-safe object for
 * storage in `webhook_events.request_headers_json`. Sensitive auth-
 * related header values are redacted — the webhook receiver needs to
 * log traffic metadata, not cache credentials.
 */
export function serializeRequestHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    out[lower] = SENSITIVE_HEADER_KEYS.has(lower) ? REDACTED_PLACEHOLDER : value;
  });
  return out;
}
