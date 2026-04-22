/**
 * Auth module — DTOs.
 *
 * DTOs are the wire shape. They are intentionally decoupled from repository
 * types so renames/refactors in the data layer don't leak into API contracts.
 */

import type { CurrentUserContext } from "@lib/auth/types";

export interface MeDto {
  user: {
    id: string;
    authUserId: string;
  };
  donor: { id: string } | null;
  courier: { id: string } | null;
  memberships: Array<{
    id: string;
    organizationId: string;
    branchId: string | null;
    roles: Array<{ id: string; code: string }>;
  }>;
}

export function toMeDto(ctx: CurrentUserContext): MeDto {
  return {
    user: {
      id: ctx.user.id,
      authUserId: ctx.user.authUserId,
    },
    donor: ctx.donor ? { id: ctx.donor.id } : null,
    courier: ctx.courier ? { id: ctx.courier.id } : null,
    memberships: ctx.memberships.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      branchId: m.branchId,
      roles: m.roles.map((r) => ({ id: r.id, code: r.code })),
    })),
  };
}
