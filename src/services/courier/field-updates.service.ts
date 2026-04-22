import "server-only";

/**
 * Courier field updates service.
 *
 * Ownership is enforced via `assertTaskOwnedByCourier` for every operation.
 * `field_task_id` and `courier_id` are sourced from the route param + auth
 * context — never from the client body.
 */

import type { CourierAuthedContext } from "@lib/auth";
import * as repo from "@repositories/field_updates/field-updates.repository";
import { assertTaskOwnedByCourier } from "./tasks.service";
import {
  toCourierFieldUpdateDto,
  type CourierFieldUpdateDto,
  type CreateFieldUpdateInput,
} from "@modules/courier/field-updates.dto";

export async function listFieldUpdatesForTask(
  ctx: CourierAuthedContext,
  taskId: string
): Promise<CourierFieldUpdateDto[]> {
  await assertTaskOwnedByCourier(ctx, taskId);
  const rows = await repo.listByTaskId(taskId);
  return rows.map(toCourierFieldUpdateDto);
}

export async function createFieldUpdateForTask(
  ctx: CourierAuthedContext,
  taskId: string,
  input: CreateFieldUpdateInput
): Promise<CourierFieldUpdateDto> {
  await assertTaskOwnedByCourier(ctx, taskId);

  const row = await repo.create({
    field_task_id: taskId,
    courier_id: ctx.courier.id,
    update_type: input.update_type,
    status_id: input.status_id ?? null,
    title: input.title ?? null,
    notes: input.notes ?? null,
    location_latitude: input.location_latitude ?? null,
    location_longitude: input.location_longitude ?? null,
    happened_at: input.happened_at ?? new Date().toISOString(),
    created_by: ctx.user.id,
  });

  return toCourierFieldUpdateDto(row);
}
