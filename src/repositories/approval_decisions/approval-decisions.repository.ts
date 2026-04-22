import "server-only";

/**
 * Approval decisions repository.
 *
 * Append-only. No UPDATE / DELETE exposed. Reads are scoped by
 * `approval_request_id`; the service verifies the parent request is
 * visible to the caller (org-scoped) before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ApprovalDecisionRow } from "@modules/approvals/approval-decisions.dto";

const TABLE = "approval_decisions";

const SELECT_COLUMNS =
  "id, approval_request_id, approval_chain_step_id, decision_by_user_id, " +
  "decision_status, decision_notes, decision_reason_ref_id, " +
  "decided_at, created_at";

export async function listByRequestId(
  approvalRequestId: string
): Promise<ApprovalDecisionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("approval_request_id", approvalRequestId)
    .order("decided_at", { ascending: true });

  if (error) throw new DependencyError("Failed to list approval decisions", error);
  return (data ?? []) as unknown as ApprovalDecisionRow[];
}

export interface CreateApprovalDecisionDbInput {
  approval_request_id: string;
  approval_chain_step_id: string;
  decision_by_user_id: string;
  decision_status: string;
  decision_notes: string | null;
  decision_reason_ref_id: string | null;
  decided_at: string;
}

export async function create(
  input: CreateApprovalDecisionDbInput
): Promise<ApprovalDecisionRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create approval decision", error);
  return data as unknown as ApprovalDecisionRow;
}
