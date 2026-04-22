/**
 * Domain — Auth.
 *
 * Pure, framework-free business rules related to identity and access.
 *
 * Phase 2 has no rules to encode here yet — the context resolver is
 * infrastructure, not a business rule, so it lives in `@lib/auth`. Future
 * rules that belong in this file:
 *
 *   - decide whether an AppUser is considered "fully onboarded"
 *   - decide whether a membership is active, suspended, pending
 *   - gate transitions such as donor verification or courier activation
 *
 * Rules here must NOT call the database or import from `@lib/supabase` —
 * they operate on already-fetched data and return decisions.
 */

import type { CurrentUserContext } from "@lib/auth/types";

/**
 * Does the caller have at least one membership? Useful as a coarse gate
 * before checking specific roles or permissions.
 */
export function hasAnyMembership(ctx: CurrentUserContext): boolean {
  return ctx.memberships.length > 0;
}
