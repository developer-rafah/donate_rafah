import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/audit_logs/audit-logs.repository";
import {
  toAuditLogDto,
  type AuditLogDto,
} from "@modules/audit/logs.dto";

export async function listAuditLogs(
  ctx: OpsAuthedContext
): Promise<AuditLogDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toAuditLogDto);
}

export async function getAuditLog(
  ctx: OpsAuthedContext,
  id: string
): Promise<AuditLogDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Audit log not found");
  return toAuditLogDto(row);
}
