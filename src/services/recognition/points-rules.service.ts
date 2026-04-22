import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/points_rules/points-rules.repository";
import {
  toPointsRuleDto,
  type PointsRuleDto,
} from "@modules/recognition/points.dto";

export async function listPointsRules(
  ctx: OpsAuthedContext
): Promise<PointsRuleDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toPointsRuleDto);
}

export async function getPointsRule(
  ctx: OpsAuthedContext,
  id: string
): Promise<PointsRuleDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Points rule not found");
  return toPointsRuleDto(row);
}
