import "server-only";

/**
 * Template versions + variables services.
 *
 * Both resources are scoped by parent template. The parent-template
 * ownership gate is delegated to `assertTemplateInCallerOrgs`. The
 * standalone `/template-versions/[versionId]` endpoint uses the
 * repository's joined `findByIdInOrgs` so a foreign-org version maps
 * to NotFound without a redundant template lookup.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as versionsRepo from "@repositories/template_versions/template-versions.repository";
import * as variablesRepo from "@repositories/template_variables/template-variables.repository";
import { assertTemplateInCallerOrgs } from "./templates.service";
import {
  toTemplateVariableDto,
  toTemplateVersionDto,
  type TemplateVariableDto,
  type TemplateVersionDto,
} from "@modules/comms/template-versions.dto";

export async function listTemplateVersions(
  ctx: OpsAuthedContext,
  templateId: string
): Promise<TemplateVersionDto[]> {
  await assertTemplateInCallerOrgs(ctx, templateId);
  const rows = await versionsRepo.listByTemplateId(templateId);
  return rows.map(toTemplateVersionDto);
}

export async function getTemplateVersion(
  ctx: OpsAuthedContext,
  versionId: string
): Promise<TemplateVersionDto> {
  const row = await versionsRepo.findByIdInOrgs(versionId, ctx.organizationIds);
  if (!row) throw new NotFoundError("Template version not found");
  return toTemplateVersionDto(row);
}

export async function listTemplateVariables(
  ctx: OpsAuthedContext,
  templateId: string
): Promise<TemplateVariableDto[]> {
  await assertTemplateInCallerOrgs(ctx, templateId);
  const rows = await variablesRepo.listByTemplateId(templateId);
  return rows.map(toTemplateVariableDto);
}
