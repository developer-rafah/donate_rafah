import "server-only";

/**
 * Courier tasks service.
 *
 * Tasks are courier-owned via `assignments`, not directly. This service
 * owns the canonical ownership predicate used by all child resources
 * (updates, proofs, intake): `assertTaskOwnedByCourier(ctx, taskId)`.
 *
 * A task is owned when the courier has an active (not rejected, not
 * unassigned) assignment linking them to that task.
 */

import type { CourierAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as assignmentsRepo from "@repositories/assignments/assignments.repository";
import * as tasksRepo from "@repositories/field_tasks/field-tasks.repository";
import {
  toCourierFieldTaskDto,
  type CourierFieldTaskDto,
} from "@modules/courier/tasks.dto";

/**
 * Raise `NotFoundError` when the task either does not exist or is not
 * reachable from the caller's courier via an active assignment. Returning
 * the same error in both cases avoids leaking existence of other couriers'
 * tasks.
 */
export async function assertTaskOwnedByCourier(
  ctx: CourierAuthedContext,
  taskId: string
): Promise<CourierFieldTaskDto> {
  const assignment = await assignmentsRepo.findActiveAssignmentForCourierAndTask(
    ctx.courier.id,
    taskId
  );
  if (!assignment) {
    throw new NotFoundError("Field task not found");
  }

  const row = await tasksRepo.findById(taskId);
  if (!row) {
    // Assignment existed but the task row is missing — treat as not found.
    throw new NotFoundError("Field task not found");
  }
  return toCourierFieldTaskDto(row);
}

export async function listCourierTasks(
  ctx: CourierAuthedContext
): Promise<CourierFieldTaskDto[]> {
  const ids = await assignmentsRepo.listActiveTaskIdsForCourier(ctx.courier.id);
  if (ids.length === 0) return [];
  const rows = await tasksRepo.listByIds(ids);
  return rows.map(toCourierFieldTaskDto);
}

export async function getCourierTask(
  ctx: CourierAuthedContext,
  taskId: string
): Promise<CourierFieldTaskDto> {
  return assertTaskOwnedByCourier(ctx, taskId);
}
