import "server-only";

/**
 * Workflow instances service.
 *
 * Owns the canonical visibility gate `assertInstanceInCallerOrgs` used
 * by every child resource (steps, action-logs, advance). The gate joins
 * through the parent template's organization_id — `workflow_instances`
 * has no org column of its own.
 *
 * On create:
 *   - verify the template exists AND belongs to one of the caller's orgs
 *   - verify the template is active
 *   - resolve the template's initial step (is_initial = true, lowest sort_order)
 *   - create the instance with current_step_id set to that initial step
 *   - create the matching step_instance in "active" status
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError, DependencyError, NotFoundError } from "@lib/errors";
import * as instancesRepo from "@repositories/workflow_instances/workflow-instances.repository";
import * as templatesRepo from "@repositories/workflow_templates/workflow-templates.repository";
import * as stepsRepo from "@repositories/workflow_steps/workflow-steps.repository";
import * as stepInstancesRepo from "@repositories/workflow_step_instances/workflow-step-instances.repository";
import {
  WORKFLOW_INSTANCE_DEFAULT_STATUS,
  WORKFLOW_STEP_INSTANCE_DEFAULT_STATUS,
} from "@domain/workflow/rules";
import {
  toWorkflowInstanceDto,
  type CreateWorkflowInstanceInput,
  type WorkflowInstanceDto,
  type WorkflowInstanceRow,
} from "@modules/workflow/instances.dto";

/**
 * Resolve + scope an instance. Loads the instance, then fetches the
 * parent template's scope row and verifies its organization is in the
 * caller's set. Returns the instance row on success or throws NotFound.
 */
export async function assertInstanceInCallerOrgs(
  ctx: OpsAuthedContext,
  id: string
): Promise<WorkflowInstanceRow> {
  const instance = await instancesRepo.findById(id);
  if (!instance) throw new NotFoundError("Workflow instance not found");

  const template = await templatesRepo.findScopeById(instance.workflow_template_id);
  if (!template || !ctx.organizationIds.includes(template.organization_id)) {
    // Treat "template in another org" the same as missing — no leak.
    throw new NotFoundError("Workflow instance not found");
  }
  return instance;
}

export async function listWorkflowInstances(
  ctx: OpsAuthedContext
): Promise<WorkflowInstanceDto[]> {
  const rows = await instancesRepo.listForOrgs(ctx.organizationIds);
  return rows.map(toWorkflowInstanceDto);
}

export async function getWorkflowInstance(
  ctx: OpsAuthedContext,
  id: string
): Promise<WorkflowInstanceDto> {
  const row = await assertInstanceInCallerOrgs(ctx, id);
  return toWorkflowInstanceDto(row);
}

export async function createWorkflowInstance(
  ctx: OpsAuthedContext,
  input: CreateWorkflowInstanceInput
): Promise<WorkflowInstanceDto> {
  const template = await templatesRepo.findScopeById(input.workflow_template_id);
  if (!template || !ctx.organizationIds.includes(template.organization_id)) {
    throw new NotFoundError("Workflow template not found");
  }
  if (!template.is_active) {
    throw new BadRequestError("Workflow template is not active");
  }
  if (template.entity_type !== input.entity_type) {
    throw new BadRequestError(
      "entity_type does not match the workflow template's declared entity_type"
    );
  }

  // Resolve the initial step — instances NEED a starting step. If the
  // template is mis-configured (no is_initial step), surface that as a
  // dependency problem, not a user error.
  const initialStep = await stepsRepo.findInitialStep(input.workflow_template_id);
  if (!initialStep) {
    throw new DependencyError(
      "Workflow template has no initial step configured"
    );
  }

  const nowIso = new Date().toISOString();
  const instance = await instancesRepo.create({
    workflow_template_id: input.workflow_template_id,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    current_step_id: initialStep.id,
    instance_status: WORKFLOW_INSTANCE_DEFAULT_STATUS,
    started_at: nowIso,
    created_by: ctx.user.id,
  });

  // Create the matching step_instance for the initial step. Its
  // payload_json defaults to `{}` — NOT NULL on the DB.
  await stepInstancesRepo.create({
    workflow_instance_id: instance.id,
    workflow_step_id: initialStep.id,
    step_status: WORKFLOW_STEP_INSTANCE_DEFAULT_STATUS,
    // Default assignment follows the step's configured role. Specific-user
    // assignment is out of scope for this phase.
    assigned_to_user_id: null,
    assigned_to_role_id: initialStep.assigned_role_id,
    started_at: initialStep.auto_start ? nowIso : null,
    due_at: null,
    payload_json: {},
    created_by: ctx.user.id,
  });

  return toWorkflowInstanceDto(instance);
}
