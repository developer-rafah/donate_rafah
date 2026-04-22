import "server-only";

/**
 * Workflow instances repository.
 *
 * `workflow_instances` has no `organization_id` column — every
 * caller-org scope check goes through the parent template.
 *
 * For LIST: we join to `workflow_templates` via PostgREST embedding
 * and filter the embedded org column in the query.
 * For POINT reads: we load the instance then the service checks the
 * template's org against the caller's set.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WorkflowInstanceRow } from "@modules/workflow/instances.dto";

const TABLE = "workflow_instances";

const SELECT_COLUMNS =
  "id, workflow_template_id, entity_type, entity_id, current_step_id, " +
  "instance_status, started_at, completed_at, cancelled_at, " +
  "created_at, updated_at, created_by";

/**
 * List instances whose parent template belongs to one of the caller's orgs.
 * Uses a PostgREST inner-join filter — Supabase v2 syntax:
 *   `.not("workflow_templates", "is", null)` + `.in("workflow_templates.organization_id", orgIds)`
 * We implement it via an `!inner` embedded resource.
 */
export async function listForOrgs(orgIds: string[]): Promise<WorkflowInstanceRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(`${SELECT_COLUMNS}, workflow_templates!inner(organization_id)`)
    .in("workflow_templates.organization_id", orgIds)
    .order("started_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list workflow instances", error);

  // Strip the embedded template from the returned rows so the repo's
  // row shape stays flat for the DTO mapper.
  return ((data ?? []) as Array<WorkflowInstanceRow & { workflow_templates?: unknown }>)
    .map(({ workflow_templates: _drop, ...rest }) => rest) as WorkflowInstanceRow[];
}

export async function findById(id: string): Promise<WorkflowInstanceRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load workflow instance", error);
  return (data as unknown as WorkflowInstanceRow) ?? null;
}

/**
 * NOT-NULL-safe insert payload. Identity fields (`started_at`,
 * `instance_status`, `created_by`) are server-sourced. `current_step_id`
 * is set to the template's initial step by the service.
 */
export interface CreateWorkflowInstanceDbInput {
  workflow_template_id: string;
  entity_type: string;
  entity_id: string;
  current_step_id: string | null;
  instance_status: string;
  started_at: string;
  created_by: string | null;
}

export async function create(
  input: CreateWorkflowInstanceDbInput
): Promise<WorkflowInstanceRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create workflow instance", error);
  return data as unknown as WorkflowInstanceRow;
}

/**
 * Patch used by the advance flow. The service has already verified
 * ownership + advance-legality before calling in.
 */
export interface WorkflowInstanceAdvancePatch {
  current_step_id: string;
  completed_at?: string | null;
  instance_status?: string;
}

export async function applyAdvance(
  id: string,
  patch: WorkflowInstanceAdvancePatch
): Promise<WorkflowInstanceRow> {
  const supabase = await createSupabaseServerClient();

  const safe: Record<string, unknown> = {
    current_step_id: patch.current_step_id,
  };
  if (patch.completed_at !== undefined) safe.completed_at = patch.completed_at;
  if (patch.instance_status !== undefined) safe.instance_status = patch.instance_status;

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to advance workflow instance", error);
  return data as unknown as WorkflowInstanceRow;
}
