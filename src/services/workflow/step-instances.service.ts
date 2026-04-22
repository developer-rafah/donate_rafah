import "server-only";

/**
 * Workflow step instances service.
 *
 * Phase 8 exposes read-only listing of step instances. Step creation
 * and completion are internal flows owned by the progression service;
 * no external POST/PATCH is offered for step_instances in this phase.
 */

import type { OpsAuthedContext } from "@lib/auth";
import * as repo from "@repositories/workflow_step_instances/workflow-step-instances.repository";
import { assertInstanceInCallerOrgs } from "./instances.service";
import {
  toWorkflowStepInstanceDto,
  type WorkflowStepInstanceDto,
} from "@modules/workflow/step-instances.dto";

export async function listStepInstancesForInstance(
  ctx: OpsAuthedContext,
  instanceId: string
): Promise<WorkflowStepInstanceDto[]> {
  await assertInstanceInCallerOrgs(ctx, instanceId);
  const rows = await repo.listByInstanceId(instanceId);
  return rows.map(toWorkflowStepInstanceDto);
}
