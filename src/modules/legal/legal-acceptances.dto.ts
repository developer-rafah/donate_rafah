/**
 * Legal acceptances — DTO + Zod create schema.
 *
 * Aligned to `public.legal_acceptances`. NOT NULL in DB:
 *   organization_id, legal_document_id, accepted_at, created_at.
 *
 * `user_id` and `donor_id` are both nullable — the caller supplies
 * exactly one of them. The service derives `organization_id` from the
 * referenced legal document; it is NOT a client-writable field.
 *
 * `ip_address` and `user_agent` are recorded from the request headers;
 * NOT client-writable.
 */

import { z } from "@lib/validation";

export interface LegalAcceptanceDto {
  id: string;
  organizationId: string;
  legalDocumentId: string;
  userId: string | null;
  donorId: string | null;
  acceptedAt: string;
  sourceChannel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  acceptanceTextSnapshot: string | null;
  createdAt: string;
}

export interface LegalAcceptanceRow {
  id: string;
  organization_id: string;
  legal_document_id: string;
  user_id: string | null;
  donor_id: string | null;
  accepted_at: string;
  source_channel: string | null;
  ip_address: string | null;
  user_agent: string | null;
  acceptance_text_snapshot: string | null;
  created_at: string;
}

export function toLegalAcceptanceDto(row: LegalAcceptanceRow): LegalAcceptanceDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    legalDocumentId: row.legal_document_id,
    userId: row.user_id,
    donorId: row.donor_id,
    acceptedAt: row.accepted_at,
    sourceChannel: row.source_channel,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    acceptanceTextSnapshot: row.acceptance_text_snapshot,
    createdAt: row.created_at,
  };
}

/**
 * POST body for creating an acceptance.
 *
 * Rules:
 *   - exactly one of `user_id` / `donor_id` must be supplied (enforced
 *     via Zod `.refine`).
 *   - `organization_id` is NEVER accepted from the body — derived from
 *     the referenced legal document.
 *   - `ip_address` / `user_agent` are NEVER accepted from the body —
 *     read from request headers server-side.
 *   - `accepted_at` defaults to the current server time if omitted.
 *   - `acceptance_text_snapshot` — if omitted, the service snapshots
 *     the document's `content_body` at acceptance time (standard
 *     consent-law practice: preserve what was accepted).
 */
export const createLegalAcceptanceSchema = z
  .object({
    legal_document_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    donor_id: z.string().uuid().optional(),
    source_channel: z.string().min(1).max(100).optional(),
    acceptance_text_snapshot: z.string().max(1_000_000).optional(),
    accepted_at: z.string().datetime().optional(),
  })
  .strict()
  .refine(
    (body) =>
      (body.user_id !== undefined) !== (body.donor_id !== undefined),
    {
      message:
        "Exactly one of user_id or donor_id must be supplied",
    }
  );

export type CreateLegalAcceptanceInput = z.infer<typeof createLegalAcceptanceSchema>;
