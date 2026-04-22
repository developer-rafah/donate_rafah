import "server-only";

/**
 * Integration providers repository — read-only.
 *
 * Org-scoped via `.in("organization_id", orgIds)`. Also exposes
 * `findActiveByProviderCode` used by the webhook receiver (no auth
 * context → we need to resolve the provider directly from the URL
 * path param).
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type {
  IntegrationProviderRow,
  IntegrationProviderScopeRow,
} from "@modules/integrations/integration-providers.dto";

const TABLE = "integration_providers";

const SELECT_COLUMNS =
  "id, organization_id, provider_type, provider_code, name_ar, name_en, " +
  "description, adapter_code, is_active, created_at, updated_at";

export async function listInOrgs(
  orgIds: string[]
): Promise<IntegrationProviderRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("provider_code", { ascending: true });

  if (error) throw new DependencyError("Failed to list integration providers", error);
  return (data ?? []) as unknown as IntegrationProviderRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<IntegrationProviderRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load integration provider", error);
  return (data as unknown as IntegrationProviderRow) ?? null;
}

/**
 * Scope lookup for FK verification during configuration writes.
 */
export async function findScopeById(
  id: string
): Promise<IntegrationProviderScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, provider_code, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load provider scope", error);
  return (data as unknown as IntegrationProviderScopeRow) ?? null;
}

/**
 * Resolve an inbound webhook's `[providerKey]` URL segment to a single
 * active provider. Returns all matching rows so the caller (receiver
 * service) can distinguish "zero match" from "ambiguous multi-tenant".
 */
export async function listActiveByProviderCode(
  providerCode: string
): Promise<IntegrationProviderScopeRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, provider_code, is_active")
    .eq("provider_code", providerCode)
    .eq("is_active", true);

  if (error) {
    throw new DependencyError("Failed to resolve provider by code", error);
  }
  return (data ?? []) as unknown as IntegrationProviderScopeRow[];
}
