import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/activity_logs/activity-logs.repository";
import {
  toActivityLogDto,
  type ActivityLogDto,
} from "@modules/audit/logs.dto";

export async function listActivityLogs(
  ctx: OpsAuthedContext
): Promise<ActivityLogDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toActivityLogDto);
}

export async function getActivityLog(
  ctx: OpsAuthedContext,
  id: string
): Promise<ActivityLogDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Activity log not found");
  return toActivityLogDto(row);
}
