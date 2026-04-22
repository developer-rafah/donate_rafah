import "server-only";

/**
 * External API logs repository — read-only.
 *
 * Org-scoped via `.in("organization_id", orgIds)`. No writes in this
 * phase; external-call logging helpers are reserved for a later
 * provider-execution layer.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ExternalApiLogRow } from "@modules/integrations/logs.dto";

const TABLE = "external_api_logs";

const SELECT_COLUMNS =
  "id, organization_id, provider_id, related_entity_type, related_entity_id, " +
  "http_method, endpoint_url, request_payload_json, response_status_code, " +
  "response_payload_json, execution_status, error_message, executed_at, created_at";

export async function listInOrgs(orgIds: string[]): Promise<ExternalApiLogRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("executed_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list external API logs", error);
  return (data ?? []) as unknown as ExternalApiLogRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<ExternalApiLogRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load external API log", error);
  return (data as unknown as ExternalApiLogRow) ?? null;
}
