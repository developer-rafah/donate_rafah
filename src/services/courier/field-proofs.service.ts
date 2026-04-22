import "server-only";

/**
 * Courier field proofs service.
 *
 * Metadata-only: accepts an `attachment_id` referencing an already-uploaded
 * `public.attachments` row. The DB FK + RLS enforce that the caller can
 * actually see the attachment.
 */

import type { CourierAuthedContext } from "@lib/auth";
import * as repo from "@repositories/field_proofs/field-proofs.repository";
import { assertTaskOwnedByCourier } from "./tasks.service";
import {
  toCourierFieldProofDto,
  type CourierFieldProofDto,
  type CreateFieldProofInput,
} from "@modules/courier/field-proofs.dto";

export async function listFieldProofsForTask(
  ctx: CourierAuthedContext,
  taskId: string
): Promise<CourierFieldProofDto[]> {
  await assertTaskOwnedByCourier(ctx, taskId);
  const rows = await repo.listByTaskId(taskId);
  return rows.map(toCourierFieldProofDto);
}

export async function createFieldProofForTask(
  ctx: CourierAuthedContext,
  taskId: string,
  input: CreateFieldProofInput
): Promise<CourierFieldProofDto> {
  await assertTaskOwnedByCourier(ctx, taskId);

  const row = await repo.create({
    field_task_id: taskId,
    field_update_id: input.field_update_id ?? null,
    proof_type: input.proof_type,
    attachment_id: input.attachment_id,
    notes: input.notes ?? null,
    captured_at: input.captured_at ?? new Date().toISOString(),
    created_by: ctx.user.id,
  });

  return toCourierFieldProofDto(row);
}
