import "server-only";

/**
 * Sorting decision logs repository.
 *
 * Scoped by parent `sorting_session_id`. The service verifies the
 * session belongs to the caller's org set before reads/writes.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DecisionLogRow } from "@modules/ops/decision-logs.dto";

const TABLE = "sorting_decision_logs";

const SELECT_COLUMNS =
  "id, sorting_session_id, sorted_item_id, decision_id, decision_notes, " +
  "decided_by, decided_at, created_at";

export async function listBySessionId(sessionId: string): Promise<DecisionLogRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("sorting_session_id", sessionId)
    .order("decided_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list decision logs", error);
  return (data ?? []) as unknown as DecisionLogRow[];
}

export interface CreateDecisionLogDbInput {
  sorting_session_id: string;
  sorted_item_id: string | null;
  decision_id: string;
  decision_notes: string | null;
  decided_by: string | null;
  decided_at: string;
}

export async function create(
  input: CreateDecisionLogDbInput
): Promise<DecisionLogRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create decision log", error);
  return data as unknown as DecisionLogRow;
}
