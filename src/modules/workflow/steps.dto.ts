/**
 * Workflow steps — internal types.
 *
 * Aligned to `public.workflow_steps`. Not exposed as a standalone CRUD
 * endpoint in this phase; consumed by the transition resolver and the
 * instance-creation path.
 */

export interface WorkflowStepRow {
  id: string;
  workflow_template_id: string;
  step_code: string;
  name_ar: string;
  name_en: string | null;
  step_type: string;
  sort_order: number;
  assigned_role_id: string | null;
  is_required: boolean;
  is_initial: boolean;
  is_terminal: boolean;
  auto_start: boolean;
  auto_complete: boolean;
  sla_hours: number | null;
  settings_json: Record<string, unknown> | null;
}
