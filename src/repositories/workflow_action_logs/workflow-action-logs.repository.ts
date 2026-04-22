import "server-only";

/**
 * Workflow action logs repository.
 *
 * Append-only. The service verifies parent-instance visibility before
 * calling in. Also provides a small helper for verifying an
 * `automation_actions` row belongs to the caller's org (used by the
 * advance flow when the client supplies an automation_action_id for
 * logging).
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WorkflowActionLogRow } from "@modules/workflow/action-logs.dto";

const TABLE = "workflow_action_logs";
const AUTOMATION_ACTIONS_TABLE = "automation_actions";

const SELECT_COLUMNS =
  "id, workflow_instance_id, workflow_step_instance_id, automation_action_id, " +
  "execution_status, request_payload_json, response_payload_json, " +
  "error_message, executed_at, created_at";

export async function listByInstanceId(
  instanceId: string
): Promise<WorkflowActionLogRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("workflow_instance_id", instanceId)
    .order("executed_at", { ascending: true });

  if (error) throw new DependencyError("Failed to list workflow action logs", error);
  return (data ?? []) as unknown as WorkflowActionLogRow[];
}

export interface CreateActionLogDbInput {
  workflow_instance_id: string;
  workflow_step_instance_id: string | null;
  automation_action_id: string;
  execution_status: string;
  request_payload_json: Record<string, unknown>;
  response_payload_json: Record<string, unknown>;
  error_message: string | null;
  executed_at: string;
}

export async function create(
  input: CreateActionLogDbInput
): Promise<WorkflowActionLogRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create action log", error);
  return data as unknown as WorkflowActionLogRow;
}

/**
 * Minimal scope check for an automation_actions row the caller wants to
 * reference in an action log. Returns null when the row does not exist.
 * The service verifies the returned `organization_id` matches the
 * caller's org set.
 */
export interface AutomationActionScopeRow {
  id: string;
  organization_id: string;
  is_active: boolean;
}

export async function findAutomationActionScope(
  id: string
): Promise<AutomationActionScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(AUTOMATION_ACTIONS_TABLE)
    .select("id, organization_id, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load automation action", error);
  return (data as unknown as AutomationActionScopeRow) ?? null;
}
