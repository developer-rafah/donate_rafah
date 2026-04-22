/**
 * Webhook events + external API logs — read-only DTOs.
 *
 * Aligned to `public.webhook_events` and `public.external_api_logs`.
 * Both are org-scoped directly via `organization_id`. Append-only in
 * this phase — no update/delete endpoints. The only write happens in
 * the webhook receiver (see `webhook-receiver.service.ts`).
 */

// ---- Webhook events ---------------------------------------------------------

export interface WebhookEventDto {
  id: string;
  organizationId: string;
  providerId: string | null;
  eventDirection: string;
  eventType: string;
  externalEventId: string | null;
  requestHeadersJson: Record<string, unknown>;
  requestBodyJson: Record<string, unknown>;
  responseBodyJson: Record<string, unknown>;
  processingStatus: string;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface WebhookEventRow {
  id: string;
  organization_id: string;
  provider_id: string | null;
  event_direction: string;
  event_type: string;
  external_event_id: string | null;
  request_headers_json: Record<string, unknown> | null;
  request_body_json: Record<string, unknown> | null;
  response_body_json: Record<string, unknown> | null;
  processing_status: string;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function toWebhookEventDto(row: WebhookEventRow): WebhookEventDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerId: row.provider_id,
    eventDirection: row.event_direction,
    eventType: row.event_type,
    externalEventId: row.external_event_id,
    requestHeadersJson: row.request_headers_json ?? {},
    requestBodyJson: row.request_body_json ?? {},
    responseBodyJson: row.response_body_json ?? {},
    processingStatus: row.processing_status,
    processedAt: row.processed_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

// ---- External API logs ------------------------------------------------------

export interface ExternalApiLogDto {
  id: string;
  organizationId: string;
  providerId: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  httpMethod: string;
  endpointUrl: string;
  requestPayloadJson: Record<string, unknown>;
  responseStatusCode: number | null;
  responsePayloadJson: Record<string, unknown>;
  executionStatus: string;
  errorMessage: string | null;
  executedAt: string;
  createdAt: string;
}

export interface ExternalApiLogRow {
  id: string;
  organization_id: string;
  provider_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  http_method: string;
  endpoint_url: string;
  request_payload_json: Record<string, unknown> | null;
  response_status_code: number | null;
  response_payload_json: Record<string, unknown> | null;
  execution_status: string;
  error_message: string | null;
  executed_at: string;
  created_at: string;
}

export function toExternalApiLogDto(row: ExternalApiLogRow): ExternalApiLogDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerId: row.provider_id,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    httpMethod: row.http_method,
    endpointUrl: row.endpoint_url,
    requestPayloadJson: row.request_payload_json ?? {},
    responseStatusCode: row.response_status_code,
    responsePayloadJson: row.response_payload_json ?? {},
    executionStatus: row.execution_status,
    errorMessage: row.error_message,
    executedAt: row.executed_at,
    createdAt: row.created_at,
  };
}
