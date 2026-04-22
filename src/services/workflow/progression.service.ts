import "server-only";

/**
 * Workflow progression service.
 *
 * Advances a workflow instance via a single step transition:
 *   1. Load the instance + verify caller visibility (org-scoped).
 *   2. Reject progression on terminal instances.
 *   3. Load active outgoing transitions from the current step.
 *   4. Pick the transition (client-disambiguated if ≥2).
 *   5. Load destination step; mark outgoing step_instance completed;
 *      create new step_instance for destination.
 *   6. Update instance.current_step_id; if destination is terminal,
 *      set instance.completed_at + instance_status to "completed".
 *   7. Optionally append a workflow_action_logs row when the client
 *      supplied an automation_action_id belonging to their org.
 *
 * This is the whole of the "workflow engine" for this phase. Condition
 * evaluation of `condition_payload_json` is NOT performed — the caller
 * selects a transition explicitly (or relies on the single-outgoing-step
 * fast path). A real rule engine belongs to a later phase.
 */

import type { OpsAuthedContext } from "@lib/auth";
import {
  BadRequestError,
  ConflictError,
  DependencyError,
  NotFoundError,
} from "@lib/errors";

import * as instancesRepo from "@repositories/workflow_instances/workflow-instances.repository";
import * as stepsRepo from "@repositories/workflow_steps/workflow-steps.repository";
import * as transitionsRepo from "@repositories/workflow_transition_rules/workflow-transition-rules.repository";
import * as stepInstancesRepo from "@repositories/workflow_step_instances/workflow-step-instances.repository";
import * as actionLogsRepo from "@repositories/workflow_action_logs/workflow-action-logs.repository";

import { assertInstanceInCallerOrgs } from "./instances.service";
import {
  WORKFLOW_INSTANCE_COMPLETED_STATUS,
  WORKFLOW_STEP_INSTANCE_COMPLETED_STATUS,
  WORKFLOW_STEP_INSTANCE_DEFAULT_STATUS,
  findStepById,
  isInstanceTerminal,
  pickTransition,
} from "@domain/workflow/rules";
import {
  toWorkflowInstanceDto,
  type AdvanceWorkflowInstanceInput,
  type WorkflowInstanceDto,
} from "@modules/workflow/instances.dto";

export async function advanceWorkflowInstance(
  ctx: OpsAuthedContext,
  instanceId: string,
  input: AdvanceWorkflowInstanceInput
): Promise<WorkflowInstanceDto> {
  const instance = await assertInstanceInCallerOrgs(ctx, instanceId);

  if (isInstanceTerminal(instance)) {
    throw new ConflictError("Workflow instance is already terminal");
  }
  if (instance.current_step_id === null) {
    throw new ConflictError(
      "Workflow instance has no current step — cannot advance"
    );
  }

  // Outgoing transitions + full step catalog for the parent template.
  const [activeOutgoing, steps] = await Promise.all([
    transitionsRepo.listActiveOutgoing({
      workflowTemplateId: instance.workflow_template_id,
      fromStepId: instance.current_step_id,
    }),
    stepsRepo.listByTemplateId(instance.workflow_template_id),
  ]);

  if (activeOutgoing.length === 0) {
    throw new ConflictError("No active outgoing transitions from current step");
  }

  const picked = pickTransition(activeOutgoing, input.transition_rule_id ?? null);
  if (!picked) {
    if (input.transition_rule_id) {
      throw new BadRequestError(
        "Supplied transition_rule_id does not match any active outgoing transition"
      );
    }
    throw new ConflictError(
      "Multiple active outgoing transitions — caller must supply transition_rule_id"
    );
  }

  const destinationStep = findStepById(steps, picked.to_step_id);
  if (!destinationStep) {
    throw new DependencyError("Transition references a missing destination step");
  }

  const nowIso = new Date().toISOString();

  // 1. Complete the outgoing step_instance (if one is active).
  const outgoingStepInstance = await stepInstancesRepo.findActiveForStep({
    workflowInstanceId: instance.id,
    workflowStepId: instance.current_step_id,
  });
  if (outgoingStepInstance) {
    await stepInstancesRepo.markCompleted(outgoingStepInstance.id, {
      completed_at: nowIso,
      step_status: WORKFLOW_STEP_INSTANCE_COMPLETED_STATUS,
      result_code: picked.rule_name, // audit trail of which rule fired
      notes: input.notes ?? null,
      updated_by: ctx.user.id,
    });
  }

  // 2. Create the new step_instance for the destination step.
  const newStepInstance = await stepInstancesRepo.create({
    workflow_instance_id: instance.id,
    workflow_step_id: destinationStep.id,
    step_status: WORKFLOW_STEP_INSTANCE_DEFAULT_STATUS,
    assigned_to_user_id: null,
    assigned_to_role_id: destinationStep.assigned_role_id,
    started_at: destinationStep.auto_start ? nowIso : null,
    due_at: null,
    payload_json: {},
    created_by: ctx.user.id,
  });

  // 3. Update instance pointer; mark terminal when the destination is
  // a terminal step.
  const updatedInstance = await instancesRepo.applyAdvance(instance.id, {
    current_step_id: destinationStep.id,
    completed_at: destinationStep.is_terminal ? nowIso : undefined,
    instance_status: destinationStep.is_terminal
      ? WORKFLOW_INSTANCE_COMPLETED_STATUS
      : undefined,
  });

  // 4. Optional action log. Required columns:
  //    workflow_instance_id, automation_action_id (FK NOT NULL),
  //    execution_status, request_payload_json, response_payload_json,
  //    executed_at. Only logged when the client supplies a real
  //    automation_action_id in their org.
  if (input.automation_action_id) {
    const aaScope = await actionLogsRepo.findAutomationActionScope(
      input.automation_action_id
    );
    if (!aaScope || !ctx.organizationIds.includes(aaScope.organization_id)) {
      throw new NotFoundError("Automation action not found");
    }
    if (!aaScope.is_active) {
      throw new BadRequestError("Automation action is not active");
    }

    await actionLogsRepo.create({
      workflow_instance_id: instance.id,
      workflow_step_instance_id: newStepInstance.id,
      automation_action_id: aaScope.id,
      // ASSUMPTION: "success" is the canonical success status code. CSV
      // has no visible check-constraint on execution_status. Single
      // constant for adjustment if the org uses a different code.
      execution_status: "success",
      request_payload_json: input.log_request_payload_json ?? {},
      response_payload_json: input.log_response_payload_json ?? {},
      error_message: null,
      executed_at: nowIso,
    });
  }

  return toWorkflowInstanceDto(updatedInstance);
}
