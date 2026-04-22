import "server-only";

/**
 * Integration configurations service.
 *
 * Read endpoints apply secret redaction via `redactConfigPayload` to
 * `config_payload_json`. Writes accept the full payload.
 *
 * Create flow:
 *   1. Verify `provider_id` belongs to one of the caller's orgs.
 *   2. Derive `organization_id` from the provider — never accepted
 *      from the body.
 *   3. Default `priority_order=0`, `is_default=false`, `is_active=true`
 *      when the client omits them (all three are NOT NULL in DB).
 *
 * Update flow:
 *   1. Verify the configuration is in the caller's orgs.
 *   2. `provider_id` + `organization_id` are NOT patchable — the Zod
 *      schema omits them, so any attempt is a validation error.
 *   3. Sparse patch — only supplied keys are updated.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError, NotFoundError } from "@lib/errors";
import * as configsRepo from "@repositories/integration_configurations/integration-configurations.repository";
import * as providersRepo from "@repositories/integration_providers/integration-providers.repository";
import { redactConfigPayload } from "@domain/integrations/rules";
import {
  toIntegrationConfigurationDto,
  type CreateIntegrationConfigurationInput,
  type IntegrationConfigurationDto,
  type UpdateIntegrationConfigurationInput,
} from "@modules/integrations/integration-configurations.dto";
import type {
  UpdateConfigurationDbPatch,
} from "@repositories/integration_configurations/integration-configurations.repository";

export async function listIntegrationConfigurations(
  ctx: OpsAuthedContext
): Promise<IntegrationConfigurationDto[]> {
  const rows = await configsRepo.listInOrgs(ctx.organizationIds);
  return rows.map((r) =>
    toIntegrationConfigurationDto(r, redactConfigPayload(r.config_payload_json))
  );
}

export async function getIntegrationConfiguration(
  ctx: OpsAuthedContext,
  id: string
): Promise<IntegrationConfigurationDto> {
  const row = await configsRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Integration configuration not found");
  return toIntegrationConfigurationDto(
    row,
    redactConfigPayload(row.config_payload_json)
  );
}

export async function createIntegrationConfiguration(
  ctx: OpsAuthedContext,
  input: CreateIntegrationConfigurationInput
): Promise<IntegrationConfigurationDto> {
  // Provider must be in caller's orgs. Its org becomes the config's org.
  const provider = await providersRepo.findScopeById(input.provider_id);
  if (!provider || !ctx.organizationIds.includes(provider.organization_id)) {
    throw new NotFoundError("Integration provider not found");
  }
  if (!provider.is_active) {
    throw new BadRequestError("Integration provider is not active");
  }

  const row = await configsRepo.create({
    organization_id: provider.organization_id,
    branch_id: input.branch_id ?? null,
    provider_id: provider.id,
    config_name: input.config_name,
    config_payload_json: input.config_payload_json,
    priority_order: input.priority_order ?? 0,
    is_default: input.is_default ?? false,
    is_active: input.is_active ?? true,
    created_by: ctx.user.id,
    updated_by: ctx.user.id,
  });

  return toIntegrationConfigurationDto(
    row,
    redactConfigPayload(row.config_payload_json)
  );
}

export async function updateIntegrationConfiguration(
  ctx: OpsAuthedContext,
  id: string,
  input: UpdateIntegrationConfigurationInput
): Promise<IntegrationConfigurationDto> {
  // Pre-check so we return NotFound when the row is missing or foreign-org,
  // rather than applying a patch to zero rows and then inspecting the result.
  const existing = await configsRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!existing) throw new NotFoundError("Integration configuration not found");

  const patch: UpdateConfigurationDbPatch = { updated_by: ctx.user.id };
  if (input.branch_id !== undefined) patch.branch_id = input.branch_id;
  if (input.config_name !== undefined) patch.config_name = input.config_name;
  if (input.config_payload_json !== undefined) {
    patch.config_payload_json = input.config_payload_json;
  }
  if (input.priority_order !== undefined) patch.priority_order = input.priority_order;
  if (input.is_default !== undefined) patch.is_default = input.is_default;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const row = await configsRepo.applyPatch(id, ctx.organizationIds, patch);
  if (!row) throw new NotFoundError("Integration configuration not found");

  return toIntegrationConfigurationDto(
    row,
    redactConfigPayload(row.config_payload_json)
  );
}
