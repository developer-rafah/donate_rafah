import "server-only";

/**
 * Workflow templates service.
 *
 * Read-only. Templates are org-scoped — rows in other orgs map to
 * NotFound (not Forbidden) to avoid existence leaks.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/workflow_templates/workflow-templates.repository";
import {
  toWorkflowTemplateDto,
  type WorkflowTemplateDto,
} from "@modules/workflow/templates.dto";

export async function listWorkflowTemplates(
  ctx: OpsAuthedContext
): Promise<WorkflowTemplateDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toWorkflowTemplateDto);
}

export async function getWorkflowTemplate(
  ctx: OpsAuthedContext,
  id: string
): Promise<WorkflowTemplateDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Workflow template not found");
  return toWorkflowTemplateDto(row);
}
