import "server-only";

/**
 * Current-user context resolver.
 *
 * Given a Supabase auth session, this module resolves:
 *   - the application user row from public.users
 *   - the donor row (if any) from public.donors
 *   - the courier row (if any) from public.couriers
 *   - the memberships (+ roles) from public.memberships / membership_roles / roles
 *
 * Returns `null` when there is no authenticated session.
 *
 * Uses the cookie-bound server client so RLS applies. If RLS policies block
 * a legitimate lookup during onboarding, the relevant service should route
 * that specific read through the service-role client — not this helper.
 */

import { logger } from "@lib/logging";
import { getAuthUser } from "./session";
import { findUserByAuthId } from "@repositories/users/users.repository";
import { findDonorByUserId } from "@repositories/donors/donors.repository";
import { findCourierByUserId } from "@repositories/couriers/couriers.repository";
import { listMembershipsForUser } from "@repositories/memberships/memberships.repository";
import type { CurrentUserContext } from "./types";

export async function getCurrentContext(): Promise<CurrentUserContext | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const user = await findUserByAuthId(authUser.id);
  if (!user) {
    // Auth session exists but no corresponding application user row — treat
    // as unauthenticated for downstream code. This typically indicates an
    // incomplete provisioning flow.
    logger.warn("auth user has no public.users row", { authUserId: authUser.id });
    return null;
  }

  const [donor, courier, memberships] = await Promise.all([
    findDonorByUserId(user.id),
    findCourierByUserId(user.id),
    listMembershipsForUser(user.id),
  ]);

  return { user, donor, courier, memberships };
}

/**
 * Shortcuts — kept as named exports so handlers can import only what they need.
 */

export async function getCurrentUser() {
  const ctx = await getCurrentContext();
  return ctx?.user ?? null;
}

export async function getCurrentDonor() {
  const ctx = await getCurrentContext();
  return ctx?.donor ?? null;
}

export async function getCurrentCourier() {
  const ctx = await getCurrentContext();
  return ctx?.courier ?? null;
}

export async function getCurrentMemberships() {
  const ctx = await getCurrentContext();
  return ctx?.memberships ?? [];
}
