/**
 * Sorted items — DTO + Zod schemas.
 *
 * Aligned to `public.sorted_items`. NOT NULL in DB:
 *   sorting_session_id, item_name, quantity, is_approved,
 *   created_at, updated_at.
 *
 * `sorting_session_id` comes from the route param on create; not writable
 * on patch.
 */

import { z } from "@lib/validation";

export interface SortedItemDto {
  id: string;
  sortingSessionId: string;
  itemClassificationId: string | null;
  donationTypeRefId: string | null;
  donationCategoryRefId: string | null;
  itemName: string;
  itemDescription: string | null;
  quantity: number;
  quantityUnitRefId: string | null;
  conditionAssessmentId: string | null;
  estimatedValueAmount: string | null; // numeric → string in PostgREST JSON
  estimatedValueCurrency: string | null;
  sortingDecisionId: string | null;
  isApproved: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SortedItemRow {
  id: string;
  sorting_session_id: string;
  item_classification_id: string | null;
  donation_type_ref_id: string | null;
  donation_category_ref_id: string | null;
  item_name: string;
  item_description: string | null;
  quantity: number;
  quantity_unit_ref_id: string | null;
  condition_assessment_id: string | null;
  estimated_value_amount: string | null;
  estimated_value_currency: string | null;
  sorting_decision_id: string | null;
  is_approved: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toSortedItemDto(row: SortedItemRow): SortedItemDto {
  return {
    id: row.id,
    sortingSessionId: row.sorting_session_id,
    itemClassificationId: row.item_classification_id,
    donationTypeRefId: row.donation_type_ref_id,
    donationCategoryRefId: row.donation_category_ref_id,
    itemName: row.item_name,
    itemDescription: row.item_description,
    quantity: row.quantity,
    quantityUnitRefId: row.quantity_unit_ref_id,
    conditionAssessmentId: row.condition_assessment_id,
    estimatedValueAmount: row.estimated_value_amount,
    estimatedValueCurrency: row.estimated_value_currency,
    sortingDecisionId: row.sorting_decision_id,
    isApproved: row.is_approved,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// `numeric` is a decimal. We accept a string (canonical) or a number.
const numericAmount = z.union([z.string().min(1).max(40), z.number().finite()]);

export const createSortedItemSchema = z
  .object({
    item_classification_id: z.string().uuid().optional(),
    donation_type_ref_id: z.string().uuid().optional(),
    donation_category_ref_id: z.string().uuid().optional(),
    item_name: z.string().min(1).max(500),
    item_description: z.string().max(4000).optional(),
    quantity: z.number().int().min(0),
    quantity_unit_ref_id: z.string().uuid().optional(),
    condition_assessment_id: z.string().uuid().optional(),
    estimated_value_amount: numericAmount.optional(),
    estimated_value_currency: z.string().length(3).optional(),
    sorting_decision_id: z.string().uuid().optional(),
    is_approved: z.boolean().optional(),
    notes: z.string().max(4000).optional(),
  })
  .strict();

export type CreateSortedItemInput = z.infer<typeof createSortedItemSchema>;

export const updateSortedItemSchema = z
  .object({
    item_classification_id: z.string().uuid().nullable().optional(),
    donation_type_ref_id: z.string().uuid().nullable().optional(),
    donation_category_ref_id: z.string().uuid().nullable().optional(),
    item_name: z.string().min(1).max(500).optional(),
    item_description: z.string().max(4000).nullable().optional(),
    quantity: z.number().int().min(0).optional(),
    quantity_unit_ref_id: z.string().uuid().nullable().optional(),
    condition_assessment_id: z.string().uuid().nullable().optional(),
    estimated_value_amount: numericAmount.nullable().optional(),
    estimated_value_currency: z.string().length(3).nullable().optional(),
    sorting_decision_id: z.string().uuid().nullable().optional(),
    is_approved: z.boolean().optional(),
    notes: z.string().max(4000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one writable field must be provided",
  });

export type UpdateSortedItemInput = z.infer<typeof updateSortedItemSchema>;
