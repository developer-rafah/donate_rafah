import "server-only";

/**
 * Courier assignments service.
 */

import type { CourierAuthedContext } from "@lib/auth";
import * as repo from "@repositories/assignments/assignments.repository";
import {
  toCourierAssignmentDto,
  type CourierAssignmentDto,
} from "@modules/courier/assignments.dto";

export async function listCourierAssignments(
  ctx: CourierAuthedContext
): Promise<CourierAssignmentDto[]> {
  const rows = await repo.listByCourierId(ctx.courier.id);
  return rows.map(toCourierAssignmentDto);
}
