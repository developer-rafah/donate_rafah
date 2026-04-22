import "server-only";

/**
 * Permissions skeleton.
 *
 * This is intentionally a skeleton for Phase 2. The real implementation will
 * resolve effective permissions from the DB-driven permission model:
 *
 *   memberships  ->  membership_roles  ->  roles
 *   roles        ->  role_permissions  ->  permissions
 *
 * Until the full permission catalog and role matrix are wired up, keep
 * callers on these helpers so a later refactor is localized.
 *
 * DO NOT hardcode business permission rules here — the permission table is
 * the source of truth. These helpers are the only surface services should
 * reach for when asking "can this actor do X?".
 */

import { ForbiddenError } from "@lib/errors";
import type { CurrentUserContext } from "@lib/auth/types";

/**
 * Stable identifier for a permission. Concrete values will come from the
 * `permissions` table; keeping this a plain string keeps the checker
 * permissive while the catalog is being finalized.
 */
export type PermissionKey = string;

/**
 * Check whether the current context includes a given permission.
 *
 * TODO(phase-3): replace this placeholder with a real lookup against
 * role_permissions + permissions. For now it returns false so that any
 * accidental early use fails closed rather than silently granting access.
 */
export function hasPermission(
  _ctx: CurrentUserContext,
  _permission: PermissionKey
): boolean {
  return false;
}

/**
 * Enforce a permission. Throws `ForbiddenError` when the check fails.
 */
export function requirePermission(
  ctx: CurrentUserContext,
  permission: PermissionKey
): void {
  if (!hasPermission(ctx, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }
}

/**
 * Convenience predicate: does the current context have any membership with
 * the given role code? Useful for quick role-gated branches where a full
 * permission lookup is overkill.
 *
 * Role codes are the stable machine identifiers from `public.roles.code`
 * (e.g. "admin", "donor_support"). Never pass display labels here.
 */
export function hasRole(ctx: CurrentUserContext, roleCode: string): boolean {
  return ctx.memberships.some((m) => m.roles.some((r) => r.code === roleCode));
}
