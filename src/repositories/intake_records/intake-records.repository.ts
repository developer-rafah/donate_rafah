import "server-only";

/**
 * Intake records repository.
 *
 * Treats intake as one row per `field_task_id`. The CSV reference does
 * not expose a unique constraint on `field_task_id` — the app enforces
 * it via a check-then-insert pattern in the service. Rows matched by
 * `field_task_id` are also gated by `courier_id` on updates so a courier
 * can't touch another courier's intake row even if they pass the id.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError, NotFoundError } from "@lib/errors";
import type { IntakeRecordRow } from "@modules/courier/intake.dto";

const TABLE = "intake_records";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, donation_request_id, field_task_id, " +
  "courier_id, intake_status, pickup_completed_at, received_quantity_text, " +
  "courier_notes, recipient_confirmation_method, requires_sorting, " +
  "created_at, updated_at";

export async function findByTaskId(
  fieldTaskId: string
): Promise<IntakeRecordRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("field_task_id", fieldTaskId)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load intake record", error);
  return (data as unknown as IntakeRecordRow) ?? null;
}

/**
 * Full NOT-NULL-safe insert payload. All identity fields are supplied by
 * the service from context / the parent field_task row.
 */
export interface CreateIntakeDbInput {
  organization_id: string;
  branch_id: string | null;
  donation_request_id: string;
  field_task_id: string;
  courier_id: string | null;
  intake_status: string;
  pickup_completed_at: string | null;
  received_quantity_text: string | null;
  courier_notes: string | null;
  recipient_confirmation_method: string | null;
  requires_sorting: boolean;
}

export async function create(input: CreateIntakeDbInput): Promise<IntakeRecordRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create intake record", error);
  return data as unknown as IntakeRecordRow;
}

/**
 * Writable subset for PATCH. Courier identity is fixed; any audit fields
 * are set by DB triggers (set_updated_at).
 */
export type IntakeRecordPatch = Partial<
  Pick<
    IntakeRecordRow,
    | "intake_status"
    | "pickup_completed_at"
    | "received_quantity_text"
    | "courier_notes"
    | "recipient_confirmation_method"
    | "requires_sorting"
  >
>;

/**
 * Update an intake row for a given field_task and courier. The extra
 * `courier_id` WHERE clause is defense-in-depth — the service already
 * verified task ownership via an active assignment before calling in,
 * but a changed courier assignment mid-flight must not silently mutate
 * another courier's intake.
 */
export async function updateByTaskId(
  fieldTaskId: string,
  courierId: string,
  patch: IntakeRecordPatch
): Promise<IntakeRecordRow> {
  const supabase = await createSupabaseServerClient();

  const safe: Record<string, unknown> = {};
  if (patch.intake_status !== undefined) safe.intake_status = patch.intake_status;
  if (patch.pickup_completed_at !== undefined)
    safe.pickup_completed_at = patch.pickup_completed_at;
  if (patch.received_quantity_text !== undefined)
    safe.received_quantity_text = patch.received_quantity_text;
  if (patch.courier_notes !== undefined) safe.courier_notes = patch.courier_notes;
  if (patch.recipient_confirmation_method !== undefined)
    safe.recipient_confirmation_method = patch.recipient_confirmation_method;
  if (patch.requires_sorting !== undefined)
    safe.requires_sorting = patch.requires_sorting;

  const { data, error } = await supabase
    .from(TABLE)
    .update(safe)
    .eq("field_task_id", fieldTaskId)
    .eq("courier_id", courierId)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to update intake record", error);
  if (!data) {
    throw new NotFoundError("Intake record not found for this task and courier");
  }
  return data as unknown as IntakeRecordRow;
}

/**
 * Minimal shape used by upstream-linkage checks (ops/sorting flow).
 */
export interface IntakeRecordScopeRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  donation_request_id: string;
  field_task_id: string;
}

/**
 * Read-only: load the org scope + donation_request link for an intake
 * record. Used by ops to verify a sorting session's intake matches its
 * donation request.
 */
export async function findScopeById(id: string): Promise<IntakeRecordScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, branch_id, donation_request_id, field_task_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load intake record scope", error);
  return (data as unknown as IntakeRecordScopeRow) ?? null;
}
