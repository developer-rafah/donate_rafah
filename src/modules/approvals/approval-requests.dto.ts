/**
 * Approval requests — DTO + Zod schema.
 *
 * Aligned to `public.approval_requests`. NOT NULL in DB:
 *   organization_id, approval_type_id, entity_type, entity_id,
 *   request_status, submitted_at, payload_json, created_at, updated_at.
 *
 * - `organization_id` is derived from the approval_type — never from body
 * - `submitted_by` is the acting user
 * - `submitted_at` defaults to "now" server-side
 * - `request_status` defaults to "pending" on create (ASSUMPTION: the
 *   default status code; CSV has no enum visible). One constant.
 * - `reviewed_by`, `reviewed_at`, `decision` are workflow-owned — NOT
 *   writable through this endpoint.
 */

import { z } from "@lib/validation";

export interface ApprovalRequestDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  approvalTypeId: string;
  entityType: string;
  entityId: string;
  requestStatus: string;
  submittedBy: string | null;
  submittedAt: string;
  assignedToUserId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decision: string | null;
  decisionReasonRefId: string | null;
  reviewNotes: string | null;
  payloadJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequestRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  approval_type_id: string;
  entity_type: string;
  entity_id: string;
  request_status: string;
  submitted_by: string | null;
  submitted_at: string;
  assigned_to_user_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision: string | null;
  decision_reason_ref_id: string | null;
  review_notes: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function toApprovalRequestDto(row: ApprovalRequestRow): ApprovalRequestDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    approvalTypeId: row.approval_type_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestStatus: row.request_status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    assignedToUserId: row.assigned_to_user_id,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    decision: row.decision,
    decisionReasonRefId: row.decision_reason_ref_id,
    reviewNotes: row.review_notes,
    payloadJson: row.payload_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body. Identity fields (organization_id, submitted_by) are
 * NEVER accepted from the client — derived from the approval_type and
 * auth context respectively. `request_status` is also server-set.
 */
export const createApprovalRequestSchema = z
  .object({
    approval_type_id: z.string().uuid(),
    entity_type: z.string().min(1).max(100),
    entity_id: z.string().uuid(),
    branch_id: z.string().uuid().optional(),
    assigned_to_user_id: z.string().uuid().optional(),
    payload_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 128, {
        message: "payload_json has too many top-level keys (max 128)",
      })
      .optional(),
  })
  .strict();

export type CreateApprovalRequestInput = z.infer<typeof createApprovalRequestSchema>;
