/**
 * Shared types for the current-user context resolver.
 *
 * These shapes are consumed by services and route handlers; repositories
 * produce them from database rows. Kept intentionally minimal for Phase 2 —
 * fields should be added only as downstream code actually needs them.
 *
 * ASSUMPTION NOTES (flagged for verification once generated DB types land):
 *   - public.users has `id` (uuid pk) and `auth_user_id` (uuid, FK -> auth.users.id)
 *   - public.donors has `id` (uuid pk) and `user_id` (uuid, FK -> public.users.id)
 *   - public.couriers has `id` (uuid pk) and `user_id` (uuid, FK -> public.users.id)
 *   - public.memberships has `id`, `user_id`, `organization_id` (and optionally `branch_id`)
 *   - public.membership_roles has `membership_id` + `role_id`
 *   - public.roles has `id` and `code` (stable machine identifier)
 * Revisit repositories/users|donors|couriers|memberships once types are generated.
 */

export interface AppUser {
  id: string;
  authUserId: string;
}

export interface DonorContext {
  id: string;
  userId: string;
  /**
   * Donor's owning organization. `public.donors.organization_id` is NOT
   * nullable — every donor row has one. Carried on the context so
   * donor-facing services (pickup locations, donation requests) can
   * populate the corresponding NOT-NULL FKs without a second query.
   */
  organizationId: string;
  /**
   * Optional branch scoping. `public.donors.branch_id` is nullable.
   */
  branchId: string | null;
}

export interface CourierContext {
  id: string;
  userId: string;
  /**
   * Courier's owning organization. `public.couriers.organization_id` is
   * NOT NULL — every courier row has one. Carried on the context so
   * courier-facing services (field updates, intake) can populate the
   * corresponding NOT-NULL FKs without a second query.
   */
  organizationId: string;
  /**
   * Optional branch scoping. `public.couriers.branch_id` is nullable.
   */
  branchId: string | null;
}

export interface RoleContext {
  id: string;
  /**
   * Stable machine identifier for the role (e.g. "admin", "donor_support").
   * This is the canonical value used by permission checks. The human-facing
   * display label lives elsewhere and must not be used for authorization.
   */
  code: string;
}

export interface MembershipContext {
  id: string;
  organizationId: string;
  branchId: string | null;
  roles: RoleContext[];
}

/**
 * Full current-user context resolved for the incoming request.
 * `user` is the only guaranteed field for an authenticated caller;
 * donor / courier / memberships are all optional and may be null/empty.
 */
export interface CurrentUserContext {
  user: AppUser;
  donor: DonorContext | null;
  courier: CourierContext | null;
  memberships: MembershipContext[];
}
