/**
 * Intake records — DTO + Zod schemas.
 *
 * Aligned to `public.intake_records`. NOT-NULL columns: `organization_id`,
 * `donation_request_id`, `field_task_id`, `intake_status`, `requires_sorting`.
 * `courier_id` is nullable per schema but always populated by this API
 * from the courier context.
 *
 * Phase 5 treats intake as one-per-task. The service checks for an
 * existing row before inserting; create returns 201, update (PATCH)
 * mutates the existing row. No DB unique constraint is guaranteed by the
 * CSV, so the check is app-level — benign race conditions under concurrent
 * writes are possible but the approval/sorting phases own stricter
 * invariants.
 */

import { z } from "@lib/validation";

export interface IntakeRecordDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  donationRequestId: string;
  fieldTaskId: string;
  courierId: string | null;
  intakeStatus: string;
  pickupCompletedAt: string | null;
  receivedQuantityText: string | null;
  courierNotes: string | null;
  recipientConfirmationMethod: string | null;
  requiresSorting: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeRecordRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  donation_request_id: string;
  field_task_id: string;
  courier_id: string | null;
  intake_status: string;
  pickup_completed_at: string | null;
  received_quantity_text: string | null;
  courier_notes: string | null;
  recipient_confirmation_method: string | null;
  requires_sorting: boolean;
  created_at: string;
  updated_at: string;
}

export function toIntakeRecordDto(row: IntakeRecordRow): IntakeRecordDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    donationRequestId: row.donation_request_id,
    fieldTaskId: row.field_task_id,
    courierId: row.courier_id,
    intakeStatus: row.intake_status,
    pickupCompletedAt: row.pickup_completed_at,
    receivedQuantityText: row.received_quantity_text,
    courierNotes: row.courier_notes,
    recipientConfirmationMethod: row.recipient_confirmation_method,
    requiresSorting: row.requires_sorting,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST body. Identity fields (`organization_id`, `donation_request_id`,
 * `field_task_id`, `courier_id`, `branch_id`) are derived — either from the
 * courier context or from the parent field_task row. `.strict()` rejects
 * unknown keys and any attempt to spoof identity.
 */
export const createIntakeSchema = z
  .object({
    intake_status: z.string().min(1).max(100),
    pickup_completed_at: z.string().datetime().optional(),
    received_quantity_text: z.string().max(500).optional(),
    courier_notes: z.string().max(4000).optional(),
    recipient_confirmation_method: z.string().max(100).optional(),
    requires_sorting: z.boolean().optional(),
  })
  .strict();

export type CreateIntakeInput = z.infer<typeof createIntakeSchema>;

/**
 * PATCH body. Same allowlist, all optional. At least one field required.
 */
export const updateIntakeSchema = z
  .object({
    intake_status: z.string().min(1).max(100).optional(),
    pickup_completed_at: z.string().datetime().nullable().optional(),
    received_quantity_text: z.string().max(500).nullable().optional(),
    courier_notes: z.string().max(4000).nullable().optional(),
    recipient_confirmation_method: z.string().max(100).nullable().optional(),
    requires_sorting: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one writable field must be provided",
  });

export type UpdateIntakeInput = z.infer<typeof updateIntakeSchema>;
