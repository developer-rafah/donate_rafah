import "server-only";

/**
 * Courier profile service.
 *
 * Assembles the courier profile view from the authenticated context, the
 * `public.couriers` row (richer read), the user's primary phone/email, and
 * the `public.profiles` row. Symmetric to the donor profile service.
 */

import type { CourierAuthedContext } from "@lib/auth";
import { DependencyError } from "@lib/errors";
import { findCourierProfileByUserId } from "@repositories/couriers/couriers.repository";
import { findProfileByUserId } from "@repositories/profiles/profiles.repository";
import { findContactChannelsById } from "@repositories/users/users.repository";
import type { CourierProfileDto } from "@modules/courier/profile.dto";

export async function getCourierProfile(
  ctx: CourierAuthedContext
): Promise<CourierProfileDto> {
  const [courierRow, profileRow, channels] = await Promise.all([
    findCourierProfileByUserId(ctx.user.id),
    findProfileByUserId(ctx.user.id),
    findContactChannelsById(ctx.user.id),
  ]);

  // The courier row MUST exist — the withCourier gate guarantees ctx.courier
  // is non-null, which in turn came from the same users.id join. If the row
  // disappeared between auth resolution and this call it's a dependency
  // failure, not a 404.
  if (!courierRow) {
    throw new DependencyError("Courier row missing after auth resolution");
  }

  return {
    courier: {
      id: courierRow.id,
      organizationId: courierRow.organization_id,
      branchId: courierRow.branch_id,
      userId: courierRow.user_id,
      courierCode: courierRow.courier_code,
      status: courierRow.status,
      vehicleTypeRefId: courierRow.vehicle_type_ref_id,
      maxDailyTasks: courierRow.max_daily_tasks,
      isActiveForAssignment: courierRow.is_active_for_assignment,
      employmentTypeRefId: courierRow.employment_type_ref_id,
      notes: courierRow.notes,
    },
    user: {
      id: ctx.user.id,
      authUserId: ctx.user.authUserId,
      primaryPhone: channels?.primaryPhone ?? null,
      primaryEmail: channels?.primaryEmail ?? null,
    },
    profile: profileRow
      ? {
          fullName: profileRow.full_name,
          displayName: profileRow.display_name,
          avatarFilePath: profileRow.avatar_file_path,
          preferredLanguage: profileRow.preferred_language,
        }
      : null,
  };
}
