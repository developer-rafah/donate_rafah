import "server-only";

/**
 * Field proofs repository.
 *
 * Metadata-only — the file lives in the attachments module. This repo
 * inserts a row linking a task (and optionally a specific field_update)
 * to a pre-existing attachment.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CourierFieldProofRow } from "@modules/courier/field-proofs.dto";

const TABLE = "field_proofs";

const SELECT_COLUMNS =
  "id, field_task_id, field_update_id, proof_type, attachment_id, notes, " +
  "captured_at, created_at, created_by";

export async function listByTaskId(fieldTaskId: string): Promise<CourierFieldProofRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("field_task_id", fieldTaskId)
    .order("captured_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list field proofs", error);
  return (data ?? []) as unknown as CourierFieldProofRow[];
}

export interface CreateFieldProofDbInput {
  field_task_id: string;
  field_update_id: string | null;
  proof_type: string;
  attachment_id: string;
  notes: string | null;
  captured_at: string;
  created_by: string | null;
}

export async function create(
  input: CreateFieldProofDbInput
): Promise<CourierFieldProofRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create field proof", error);
  return data as unknown as CourierFieldProofRow;
}
