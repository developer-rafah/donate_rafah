/**
 * Workflow action logs — DTO.
 *
 * Aligned to `public.workflow_action_logs`. NOT NULL in DB:
 *   workflow_instance_id, automation_action_id, execution_status,
 *   request_payload_json, response_payload_json, executed_at, created_at.
 *
 * Append-only.
 */

export interface WorkflowActionLogDto {
  id: string;
  workflowInstanceId: string;
  workflowStepInstanceId: string | null;
  automationActionId: string;
  executionStatus: string;
  requestPayloadJson: Record<string, unknown>;
  responsePayloadJson: Record<string, unknown>;
  errorMessage: string | null;
  executedAt: string;
  createdAt: string;
}

export interface WorkflowActionLogRow {
  id: string;
  workflow_instance_id: string;
  workflow_step_instance_id: string | null;
  automation_action_id: string;
  execution_status: string;
  request_payload_json: Record<string, unknown> | null;
  response_payload_json: Record<string, unknown> | null;
  error_message: string | null;
  executed_at: string;
  created_at: string;
}

export function toWorkflowActionLogDto(row: WorkflowActionLogRow): WorkflowActionLogDto {
  return {
    id: row.id,
    workflowInstanceId: row.workflow_instance_id,
    workflowStepInstanceId: row.workflow_step_instance_id,
    automationActionId: row.automation_action_id,
    executionStatus: row.execution_status,
    requestPayloadJson: row.request_payload_json ?? {},
    responsePayloadJson: row.response_payload_json ?? {},
    errorMessage: row.error_message,
    executedAt: row.executed_at,
    createdAt: row.created_at,
  };
}
