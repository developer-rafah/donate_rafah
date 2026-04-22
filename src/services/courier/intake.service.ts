import "server-only";

/**
 * Courier intake service.
 *
 * One intake row per `field_task_id`. POST creates if absent and fails
 * with CONFLICT if one already exists — the donor/internal flow can GET
 * the existing row instead. PATCH mutates the existing row (gated by both
 * field_task_id and courier_id in the repo).
 *
 * `organization_id`, `branch_id`, `donation_request_id` are sourced from
 * the parent field_task row — never from client input. `courier_id` is
 * the authenticated courier.
 */

import type { CourierAuthedContext } from "@lib/auth";
import { ConflictError, NotFoundError } from "@lib/errors";
import * as repo from "@repositories/intake_records/intake-records.repository";
import { assertTaskOwnedByCourier } from "./tasks.service";
import {
  toIntakeRecordDto,
  type CreateIntakeInput,
  type IntakeRecordDto,
  type UpdateIntakeInput,
} from "@modules/courier/intake.dto";

export async function getIntakeForTask(
  ctx: CourierAuthedContext,
  taskId: string
): Promise<IntakeRecordDto | null> {
  await assertTaskOwnedByCourier(ctx, taskId);
  const row = await repo.findByTaskId(taskId);
  return row ? toIntakeRecordDto(row) : null;
}

export async function createIntakeForTask(
  ctx: CourierAuthedContext,
  taskId: string,
  input: CreateIntakeInput
): Promise<IntakeRecordDto> {
  // Task ownership + parent task row (for org / donation_request_id).
  const task = await assertTaskOwnedByCourier(ctx, taskId);

  // One-per-task guard — app-level check because CSV reference does not
  // show a unique constraint on field_task_id. Benign race possible under
  // concurrent POSTs; later phases (approval/sorting) enforce stricter.
  const existing = await repo.findByTaskId(taskId);
  if (existing) {
    throw new ConflictError("Intake record already exists for this task");
  }

  const row = await repo.create({
    organization_id: task.organizationId,
    branch_id: task.branchId,
    donation_request_id: task.donationRequestId,
    field_task_id: task.id,
    courier_id: ctx.courier.id,
    intake_status: input.intake_status,
    pickup_completed_at: input.pickup_completed_at ?? null,
    received_quantity_text: input.received_quantity_text ?? null,
    courier_notes: input.courier_notes ?? null,
    recipient_confirmation_method: input.recipient_confirmation_method ?? null,
    // NOT NULL in the DB. Default to false when the client omits it.
    requires_sorting: input.requires_sorting ?? false,
  });

  return toIntakeRecordDto(row);
}

export async function updateIntakeForTask(
  ctx: CourierAuthedContext,
  taskId: string,
  input: UpdateIntakeInput
): Promise<IntakeRecordDto> {
  await assertTaskOwnedByCourier(ctx, taskId);

  // Ensure a row exists before attempting to patch — gives a clean 404
  // instead of a silent no-op.
  const existing = await repo.findByTaskId(taskId);
  if (!existing) {
    throw new NotFoundError("Intake record not found for this task");
  }

  const row = await repo.updateByTaskId(taskId, ctx.courier.id, {
    intake_status: input.intake_status,
    pickup_completed_at: input.pickup_completed_at,
    received_quantity_text: input.received_quantity_text,
    courier_notes: input.courier_notes,
    recipient_confirmation_method: input.recipient_confirmation_method,
    requires_sorting: input.requires_sorting,
  });

  return toIntakeRecordDto(row);
}
