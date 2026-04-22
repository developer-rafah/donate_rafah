/**
 * Workflow instances — DTO + Zod schemas.
 *
 * Aligned to `public.workflow_instances`. NOT NULL in DB:
 *   workflow_template_id, entity_type, entity_id, instance_status,
 *   started_at, created_at, updated_at.
 *
 * Note: `workflow_instances` has no `organization_id` column — every
 * org-scoping check goes through the parent `workflow_templates.org_id`.
 */

import { z } from "@lib/validation";

export interface WorkflowInstanceDto {
  id: string;
  workflowTemplateId: string;
  entityType: string;
  entityId: string;
  currentStepId: string | null;
  instanceStatus: string;
  startedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface WorkflowInstanceRow {
  id: string;
  workflow_template_id: string;
  entity_type: string;
  entity_id: string;
  current_step_id: string | null;
  instance_status: string;
  started_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function toWorkflowInstanceDto(row: WorkflowInstanceRow): WorkflowInstanceDto {
  return {
    id: row.id,
    workflowTemplateId: row.workflow_template_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    currentStepId: row.current_step_id,
    instanceStatus: row.instance_status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * POST body for creating an instance. The service resolves the
 * `workflow_template_id`'s org and verifies it belongs to the caller;
 * `started_at`, `instance_status`, `current_step_id`, and `created_by`
 * are server-sourced.
 */
export const createWorkflowInstanceSchema = z
  .object({
    workflow_template_id: z.string().uuid(),
    entity_type: z.string().min(1).max(100),
    entity_id: z.string().uuid(),
  })
  .strict();

export type CreateWorkflowInstanceInput = z.infer<typeof createWorkflowInstanceSchema>;

/**
 * POST body for advance. `transition_rule_id` disambiguates when the
 * current step has multiple active outgoing transitions; when the step
 * has exactly one active outgoing transition, the field is optional.
 *
 * `automation_action_id` is optional — when supplied, an action log
 * row is recorded. The schema's NOT NULL constraint on
 * `workflow_action_logs.automation_action_id` prevents us from logging
 * without a concrete automation_actions row the caller can reference.
 */
export const advanceWorkflowInstanceSchema = z
  .object({
    transition_rule_id: z.string().uuid().optional(),
    notes: z.string().max(4000).optional(),
    automation_action_id: z.string().uuid().optional(),
    log_request_payload_json: z.record(z.string(), z.unknown()).optional(),
    log_response_payload_json: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type AdvanceWorkflowInstanceInput = z.infer<typeof advanceWorkflowInstanceSchema>;
