import "server-only";

/**
 * Workflow templates repository.
 *
 * Org-scoped via `.in("organization_id", orgIds)` — matches the Phase 6/7
 * pattern. This phase exposes read-only endpoints; no CRUD.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { WorkflowTemplateRow } from "@modules/workflow/templates.dto";

const TABLE = "workflow_templates";

const SELECT_COLUMNS =
  "id, organization_id, template_code, name_ar, name_en, description, " +
  "entity_type, donation_type_ref_id, donation_category_ref_id, branch_id, " +
  "is_default, is_active, version_number, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<WorkflowTemplateRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list workflow templates", error);
  return (data ?? []) as unknown as WorkflowTemplateRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<WorkflowTemplateRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load workflow template", error);
  return (data as unknown as WorkflowTemplateRow) ?? null;
}

/**
 * Minimal scope row used for org-membership checks on instance creation.
 */
export interface WorkflowTemplateScopeRow {
  id: string;
  organization_id: string;
  entity_type: string;
  is_active: boolean;
}

export async function findScopeById(
  id: string
): Promise<WorkflowTemplateScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, entity_type, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load template scope", error);
  return (data as unknown as WorkflowTemplateScopeRow) ?? null;
}
