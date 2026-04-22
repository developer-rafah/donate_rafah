/**
 * Estimated values — DTO + Zod schema.
 *
 * Aligned to `public.estimated_values`. NOT NULL in DB:
 *   sorting_session_id, valuation_type, estimated_amount, currency_code,
 *   status, created_at, updated_at.
 *
 * `sorted_item_id` is nullable in the DB; this phase's endpoint is
 * routed as a child of a sorted item, so the service always supplies it.
 * `sorting_session_id` is derived from the parent sorted item — never
 * accepted from the client.
 *
 * Approval linking (`approved_by`, `approved_at`) is NOT writable by
 * this endpoint. Approvals belong to a later phase.
 */

import { z } from "@lib/validation";

export interface EstimatedValueDto {
  id: string;
  sortingSessionId: string;
  sortedItemId: string | null;
  valuationType: string;
  estimatedAmount: string;
  currencyCode: string;
  valuationNotes: string | null;
  valuedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimatedValueRow {
  id: string;
  sorting_session_id: string;
  sorted_item_id: string | null;
  valuation_type: string;
  estimated_amount: string;
  currency_code: string;
  valuation_notes: string | null;
  valued_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function toEstimatedValueDto(row: EstimatedValueRow): EstimatedValueDto {
  return {
    id: row.id,
    sortingSessionId: row.sorting_session_id,
    sortedItemId: row.sorted_item_id,
    valuationType: row.valuation_type,
    estimatedAmount: row.estimated_amount,
    currencyCode: row.currency_code,
    valuationNotes: row.valuation_notes,
    valuedBy: row.valued_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const numericAmount = z.union([z.string().min(1).max(40), z.number().finite()]);

export const createEstimatedValueSchema = z
  .object({
    valuation_type: z.string().min(1).max(100),
    estimated_amount: numericAmount,
    currency_code: z.string().length(3),
    valuation_notes: z.string().max(4000).optional(),
    status: z.string().min(1).max(100),
  })
  .strict();

export type CreateEstimatedValueInput = z.infer<typeof createEstimatedValueSchema>;
