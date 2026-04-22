import "server-only";

/**
 * Workflow step instances repository.
 *
 * Scoped by parent `workflow_instance_id`. The service verifies the
 * instance belongs to the caller's org set before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WorkflowStepInstanceRow } from "@modules/workflow/step-instances.dto";

const TABLE = "workflow_step_instances";

const SELECT_COLUMNS =
  "id, workflow_instance_id, workflow_step_id, step_status, " +
  "assigned_to_user_id, assigned_to_role_id, started_at, completed_at, " +
  "skipped_at, due_at, result_code, notes, payload_json, " +
  "created_at, updated_at";

export async function listByInstanceId(
  instanceId: string
): Promise<WorkflowStepInstanceRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("workflow_instance_id", instanceId)
    .order("created_at", { ascending: true });

  if (error) throw new DependencyError("Failed to list step instances", error);
  return (data ?? []) as unknown as WorkflowStepInstanceRow[];
}

/**
 * Find the currently-active step instance for a given instance + step.
 * Used by the advance flow to mark the outgoing step completed.
 */
export async function findActiveForStep(args: {
  workflowInstanceId: string;
  workflowStepId: string;
}): Promise<WorkflowStepInstanceRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("workflow_instance_id", args.workflowInstanceId)
    .eq("workflow_step_id", args.workflowStepId)
    .is("completed_at", null)
    .is("skipped_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load active step instance", error);
  return (data as unknown as WorkflowStepInstanceRow) ?? null;
}

export interface CreateStepInstanceDbInput {
  workflow_instance_id: string;
  workflow_step_id: string;
  step_status: string;
  assigned_to_user_id: string | null;
  assigned_to_role_id: string | null;
  started_at: string | null;
  due_at: string | null;
  payload_json: Record<string, unknown>;
  created_by: string | null;
}

export async function create(
  input: CreateStepInstanceDbInput
): Promise<WorkflowStepInstanceRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create step instance", error);
  return data as unknown as WorkflowStepInstanceRow;
}

/**
 * Mark a step instance completed. `updated_by` is set from the acting
 * user via the service.
 */
export async function markCompleted(
  id: string,
  args: {
    completed_at: string;
    step_status: string;
    result_code: string | null;
    notes: string | null;
    updated_by: string | null;
  }
): Promise<WorkflowStepInstanceRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      completed_at: args.completed_at,
      step_status: args.step_status,
      result_code: args.result_code,
      notes: args.notes,
      updated_by: args.updated_by,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to complete step instance", error);
  return data as unknown as WorkflowStepInstanceRow;
}
