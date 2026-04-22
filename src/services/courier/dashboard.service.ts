import "server-only";

/**
 * Courier dashboard service.
 *
 * Aggregates the courier profile plus the small set of counters we can
 * realistically derive from the current schema.
 */

import type { CourierAuthedContext } from "@lib/auth";
import * as assignmentsRepo from "@repositories/assignments/assignments.repository";
import * as tasksRepo from "@repositories/field_tasks/field-tasks.repository";
import { getCourierProfile } from "./profile.service";
import type { CourierDashboardDto } from "@modules/courier/dashboard.dto";

export async function getCourierDashboard(
  ctx: CourierAuthedContext
): Promise<CourierDashboardDto> {
  const [profile, activeAssignments, activeTaskIds] = await Promise.all([
    getCourierProfile(ctx),
    assignmentsRepo.countActiveByCourierId(ctx.courier.id),
    assignmentsRepo.listActiveTaskIdsForCourier(ctx.courier.id),
  ]);

  const openTasks = await tasksRepo.countOpenByIds(activeTaskIds);

  return {
    profile,
    totals: {
      activeAssignments,
      openTasks,
      // No derivable "pending" semantics for proofs/updates in the schema.
      pendingProofs: null,
      pendingUpdates: null,
    },
  };
}
