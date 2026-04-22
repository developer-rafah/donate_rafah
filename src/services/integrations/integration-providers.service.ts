import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/integration_providers/integration-providers.repository";
import {
  toIntegrationProviderDto,
  type IntegrationProviderDto,
} from "@modules/integrations/integration-providers.dto";

export async function listIntegrationProviders(
  ctx: OpsAuthedContext
): Promise<IntegrationProviderDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toIntegrationProviderDto);
}

export async function getIntegrationProvider(
  ctx: OpsAuthedContext,
  id: string
): Promise<IntegrationProviderDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Integration provider not found");
  return toIntegrationProviderDto(row);
}
