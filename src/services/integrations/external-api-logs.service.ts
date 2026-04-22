import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/external_api_logs/external-api-logs.repository";
import {
  toExternalApiLogDto,
  type ExternalApiLogDto,
} from "@modules/integrations/logs.dto";

export async function listExternalApiLogs(
  ctx: OpsAuthedContext
): Promise<ExternalApiLogDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toExternalApiLogDto);
}

export async function getExternalApiLog(
  ctx: OpsAuthedContext,
  id: string
): Promise<ExternalApiLogDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("External API log not found");
  return toExternalApiLogDto(row);
}
