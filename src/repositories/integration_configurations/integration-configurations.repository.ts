import "server-only";

/**
 * Integration configurations repository.
 *
 * Org-scoped via `organization_id`. Supports list + findByIdInOrgs +
 * create + partial update. The service layer handles the secret-
 * redaction read transform.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { IntegrationConfigurationRow } from "@modules/integrations/integration-configurations.dto";

const TABLE = "integration_configurations";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, provider_id, config_name, " +
  "config_payload_json, priority_order, is_default, is_active, " +
  "created_at, updated_at, created_by, updated_by";

export async function listInOrgs(
  orgIds: string[]
): Promise<IntegrationConfigurationRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("priority_order", { ascending: true });

  if (error) {
    throw new DependencyError("Failed to list integration configurations", error);
  }
  return (data ?? []) as unknown as IntegrationConfigurationRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<IntegrationConfigurationRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load integration configuration", error);
  }
  return (data as unknown as IntegrationConfigurationRow) ?? null;
}

export interface CreateConfigurationDbInput {
  organization_id: string;
  branch_id: string | null;
  provider_id: string;
  config_name: string;
  config_payload_json: Record<string, unknown>;
  priority_order: number;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
}

export async function create(
  input: CreateConfigurationDbInput
): Promise<IntegrationConfigurationRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw new DependencyError("Failed to create integration configuration", error);
  }
  return data as unknown as IntegrationConfigurationRow;
}

/**
 * PATCH-style partial update. The service builds a sparse object
 * containing only the columns the caller supplied and passes it in.
 * `provider_id` and `organization_id` are NOT part of the patch set
 * — the service enforces that before calling in.
 */
export interface UpdateConfigurationDbPatch {
  branch_id?: string | null;
  config_name?: string;
  config_payload_json?: Record<string, unknown>;
  priority_order?: number;
  is_default?: boolean;
  is_active?: boolean;
  updated_by: string | null;
}

export async function applyPatch(
  id: string,
  orgIds: string[],
  patch: UpdateConfigurationDbPatch
): Promise<IntegrationConfigurationRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .in("organization_id", orgIds)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to update integration configuration", error);
  }
  return (data as unknown as IntegrationConfigurationRow) ?? null;
}
