import "server-only";

/**
 * Approval requests repository.
 *
 * All reads are org-scoped via `.in("organization_id", orgIds)`, matching
 * the pattern used by the rest of the ops module. A request in another
 * org simply does not exist from the caller's perspective (NotFound).
 *
 * This phase does NOT UPDATE approval_requests rows — the workflow
 * engine (later phase) aggregates decisions into request status /
 * decision / reviewed_* columns. Decisions are recorded append-only on
 * `approval_decisions` instead.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ApprovalRequestRow } from "@modules/approvals/approval-requests.dto";

const TABLE = "approval_requests";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, approval_type_id, entity_type, entity_id, " +
  "request_status, submitted_by, submitted_at, assigned_to_user_id, " +
  "reviewed_by, reviewed_at, decision, decision_reason_ref_id, review_notes, " +
  "payload_json, created_at, updated_at";

export async function listInOrgs(orgIds: string[]): Promise<ApprovalRequestRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("submitted_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list approval requests", error);
  return (data ?? []) as unknown as ApprovalRequestRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<ApprovalRequestRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load approval request", error);
  return (data as unknown as ApprovalRequestRow) ?? null;
}

/**
 * NOT-NULL-safe insert payload. Identity fields (organization_id,
 * submitted_by, request_status, submitted_at, payload_json) are supplied
 * by the service — never from the client body.
 */
export interface CreateApprovalRequestDbInput {
  organization_id: string;
  branch_id: string | null;
  approval_type_id: string;
  entity_type: string;
  entity_id: string;
  request_status: string;
  submitted_by: string | null;
  submitted_at: string;
  assigned_to_user_id: string | null;
  payload_json: Record<string, unknown>;
}

export async function create(
  input: CreateApprovalRequestDbInput
): Promise<ApprovalRequestRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create approval request", error);
  return data as unknown as ApprovalRequestRow;
}
