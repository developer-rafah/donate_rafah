/**
 * Sorting decision logs — DTO + Zod schema.
 *
 * Aligned to `public.sorting_decision_logs`. NOT NULL in DB:
 *   sorting_session_id, decision_id, decided_at, created_at.
 *
 * `sorting_session_id` comes from the route param. `decided_by` is taken
 * from the authenticated user — never accepted from the client.
 * `decided_at` defaults to "now" server-side when the client omits it.
 *
 * If `sorted_item_id` is supplied, the service verifies the item belongs
 * to the parent session (not just any session).
 */

import { z } from "@lib/validation";

export interface DecisionLogDto {
  id: string;
  sortingSessionId: string;
  sortedItemId: string | null;
  decisionId: string;
  decisionNotes: string | null;
  decidedBy: string | null;
  decidedAt: string;
  createdAt: string;
}

export interface DecisionLogRow {
  id: string;
  sorting_session_id: string;
  sorted_item_id: string | null;
  decision_id: string;
  decision_notes: string | null;
  decided_by: string | null;
  decided_at: string;
  created_at: string;
}

export function toDecisionLogDto(row: DecisionLogRow): DecisionLogDto {
  return {
    id: row.id,
    sortingSessionId: row.sorting_session_id,
    sortedItemId: row.sorted_item_id,
    decisionId: row.decision_id,
    decisionNotes: row.decision_notes,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

export const createDecisionLogSchema = z
  .object({
    sorted_item_id: z.string().uuid().optional(),
    decision_id: z.string().uuid(),
    decision_notes: z.string().max(4000).optional(),
    decided_at: z.string().datetime().optional(),
  })
  .strict();

export type CreateDecisionLogInput = z.infer<typeof createDecisionLogSchema>;
