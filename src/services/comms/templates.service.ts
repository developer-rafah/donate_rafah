import "server-only";

/**
 * Templates service.
 *
 * Owns `assertTemplateInCallerOrgs` — the canonical visibility gate
 * used by the versions and variables services.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/templates/templates.repository";
import {
  toTemplateDto,
  type TemplateDto,
  type TemplateRow,
} from "@modules/comms/templates.dto";

export async function assertTemplateInCallerOrgs(
  ctx: OpsAuthedContext,
  id: string
): Promise<TemplateRow> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Template not found");
  return row;
}

export async function listTemplates(
  ctx: OpsAuthedContext
): Promise<TemplateDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toTemplateDto);
}

export async function getTemplate(
  ctx: OpsAuthedContext,
  id: string
): Promise<TemplateDto> {
  const row = await assertTemplateInCallerOrgs(ctx, id);
  return toTemplateDto(row);
}
