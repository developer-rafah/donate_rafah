/**
 * Workflow step instances — DTO.
 *
 * Aligned to `public.workflow_step_instances`. NOT NULL in DB:
 *   workflow_instance_id, workflow_step_id, step_status, payload_json,
 *   created_at, updated_at.
 *
 * `payload_json` defaults to `{}` on creation when the service doesn't
 * have context-specific data.
 */

export interface WorkflowStepInstanceDto {
  id: string;
  workflowInstanceId: string;
  workflowStepId: string;
  stepStatus: string;
  assignedToUserId: string | null;
  assignedToRoleId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  dueAt: string | null;
  resultCode: string | null;
  notes: string | null;
  payloadJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepInstanceRow {
  id: string;
  workflow_instance_id: string;
  workflow_step_id: string;
  step_status: string;
  assigned_to_user_id: string | null;
  assigned_to_role_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  due_at: string | null;
  result_code: string | null;
  notes: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function toWorkflowStepInstanceDto(
  row: WorkflowStepInstanceRow
): WorkflowStepInstanceDto {
  return {
    id: row.id,
    workflowInstanceId: row.workflow_instance_id,
    workflowStepId: row.workflow_step_id,
    stepStatus: row.step_status,
    assignedToUserId: row.assigned_to_user_id,
    assignedToRoleId: row.assigned_to_role_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    skippedAt: row.skipped_at,
    dueAt: row.due_at,
    resultCode: row.result_code,
    notes: row.notes,
    payloadJson: row.payload_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
