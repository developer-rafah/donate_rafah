/**
 * Approval decisions — DTO + Zod schema.
 *
 * Aligned to `public.approval_decisions`. NOT NULL in DB:
 *   approval_request_id, approval_chain_step_id, decision_by_user_id,
 *   decision_status, decided_at, created_at.
 *
 * - `approval_request_id` comes from the route param
 * - `approval_chain_step_id` is derived by the service via next-step
 *   resolution — the client cannot spoof an arbitrary step. If the
 *   client supplies `approval_chain_step_id`, the service verifies it
 *   matches the currently-pending step.
 * - `decision_by_user_id` is ALWAYS `ctx.user.id`
 * - `decided_at` defaults to "now" server-side
 *
 * Append-only: the service never UPDATEs or DELETEs decision rows.
 */

import { z } from "@lib/validation";

export interface ApprovalDecisionDto {
  id: string;
  approvalRequestId: string;
  approvalChainStepId: string;
  decisionByUserId: string;
  decisionStatus: string;
  decisionNotes: string | null;
  decisionReasonRefId: string | null;
  decidedAt: string;
  createdAt: string;
}

export interface ApprovalDecisionRow {
  id: string;
  approval_request_id: string;
  approval_chain_step_id: string;
  decision_by_user_id: string;
  decision_status: string;
  decision_notes: string | null;
  decision_reason_ref_id: string | null;
  decided_at: string;
  created_at: string;
}

export function toApprovalDecisionDto(row: ApprovalDecisionRow): ApprovalDecisionDto {
  return {
    id: row.id,
    approvalRequestId: row.approval_request_id,
    approvalChainStepId: row.approval_chain_step_id,
    decisionByUserId: row.decision_by_user_id,
    decisionStatus: row.decision_status,
    decisionNotes: row.decision_notes,
    decisionReasonRefId: row.decision_reason_ref_id,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

/**
 * POST body. Identity fields are NEVER accepted from the client.
 * `approval_chain_step_id` is optional — the service resolves the
 * currently-pending step automatically. If supplied, the service
 * verifies it matches the pending step (mismatch = ConflictError).
 */
export const createApprovalDecisionSchema = z
  .object({
    decision_status: z.string().min(1).max(100),
    decision_notes: z.string().max(4000).optional(),
    decision_reason_ref_id: z.string().uuid().optional(),
    approval_chain_step_id: z.string().uuid().optional(),
    decided_at: z.string().datetime().optional(),
  })
  .strict();

export type CreateApprovalDecisionInput = z.infer<typeof createApprovalDecisionSchema>;
