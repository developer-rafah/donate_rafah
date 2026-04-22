import "server-only";

/**
 * Webhook events repository.
 *
 * Read-scoped via `.in("organization_id", orgIds)` for the ops
 * endpoints. The webhook receiver service calls `create` with an
 * explicit `organization_id` it has resolved from the URL path.
 *
 * Append-only in this phase.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WebhookEventRow } from "@modules/integrations/logs.dto";

const TABLE = "webhook_events";

const SELECT_COLUMNS =
  "id, organization_id, provider_id, event_direction, event_type, " +
  "external_event_id, request_headers_json, request_body_json, " +
  "response_body_json, processing_status, processed_at, error_message, " +
  "created_at";

export async function listInOrgs(orgIds: string[]): Promise<WebhookEventRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list webhook events", error);
  return (data ?? []) as unknown as WebhookEventRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<WebhookEventRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load webhook event", error);
  return (data as unknown as WebhookEventRow) ?? null;
}

export interface CreateWebhookEventDbInput {
  organization_id: string;
  provider_id: string | null;
  event_direction: string;
  event_type: string;
  external_event_id: string | null;
  request_headers_json: Record<string, unknown>;
  request_body_json: Record<string, unknown>;
  response_body_json: Record<string, unknown>;
  processing_status: string;
}

export async function create(
  input: CreateWebhookEventDbInput
): Promise<WebhookEventRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create webhook event", error);
  return data as unknown as WebhookEventRow;
}
