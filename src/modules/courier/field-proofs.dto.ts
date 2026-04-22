/**
 * Courier field proofs — DTO + Zod schema.
 *
 * Aligned to `public.field_proofs`. NOT-NULL columns: `field_task_id`,
 * `proof_type`, `attachment_id`, `captured_at`. `field_update_id` is an
 * optional link to a specific field update, `created_by` is the acting user.
 *
 * File upload itself is out of scope — the client uploads the file
 * elsewhere (creating an `attachments` row) and then POSTs the resulting
 * `attachment_id` here to record the metadata link.
 */

import { z } from "@lib/validation";

export interface CourierFieldProofDto {
  id: string;
  fieldTaskId: string;
  fieldUpdateId: string | null;
  proofType: string;
  attachmentId: string;
  notes: string | null;
  capturedAt: string;
  createdAt: string;
  createdBy: string | null;
}

export interface CourierFieldProofRow {
  id: string;
  field_task_id: string;
  field_update_id: string | null;
  proof_type: string;
  attachment_id: string;
  notes: string | null;
  captured_at: string;
  created_at: string;
  created_by: string | null;
}

export function toCourierFieldProofDto(row: CourierFieldProofRow): CourierFieldProofDto {
  return {
    id: row.id,
    fieldTaskId: row.field_task_id,
    fieldUpdateId: row.field_update_id,
    proofType: row.proof_type,
    attachmentId: row.attachment_id,
    notes: row.notes,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

/**
 * POST body for field proofs. `field_task_id` comes from the route param,
 * `created_by` from the auth context. `attachment_id` must reference an
 * already-existing `public.attachments` row the caller can see; the DB
 * FK constraint and RLS enforce that — we don't re-check it here.
 */
export const createFieldProofSchema = z
  .object({
    proof_type: z.string().min(1).max(100),
    attachment_id: z.string().uuid(),
    field_update_id: z.string().uuid().optional(),
    notes: z.string().max(2000).optional(),
    captured_at: z.string().datetime().optional(),
  })
  .strict();

export type CreateFieldProofInput = z.infer<typeof createFieldProofSchema>;
