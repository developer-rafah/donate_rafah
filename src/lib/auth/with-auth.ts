import "server-only";

/**
 * Protected route wrapper.
 *
 * Turns "I need an authenticated context" into a one-line concern for any
 * route handler. The wrapped handler receives a guaranteed `CurrentUserContext`
 * and the original `Request` — unauthenticated callers never reach it.
 *
 * Usage:
 *
 *   export const GET = withAuth(async (req, ctx) => {
 *     return ok({ userId: ctx.user.id });
 *   });
 *
 * Combine with `withErrorHandling` via the exported `withAuthHandler` helper
 * when you also want the standard error envelope:
 *
 *   export const GET = withAuthHandler(async (req, ctx) => { ... });
 */

import type { NextResponse } from "next/server";
import { ForbiddenError, UnauthenticatedError } from "@lib/errors";
import { withErrorHandling } from "@lib/http/response";
import { getCurrentContext } from "./current-user";
import type { CourierContext, CurrentUserContext, DonorContext } from "./types";

export type AuthedHandler = (
  req: Request,
  ctx: CurrentUserContext
) => Promise<NextResponse>;

/**
 * Context passed to donor-scoped handlers. Guarantees `donor` is non-null.
 */
export interface DonorAuthedContext extends CurrentUserContext {
  donor: DonorContext;
}

export type DonorAuthedHandler = (
  req: Request,
  ctx: DonorAuthedContext
) => Promise<NextResponse>;

/**
 * Context passed to courier-scoped handlers. Guarantees `courier` is non-null.
 */
export interface CourierAuthedContext extends CurrentUserContext {
  courier: CourierContext;
}

export type CourierAuthedHandler = (
  req: Request,
  ctx: CourierAuthedContext
) => Promise<NextResponse>;

/**
 * Context passed to internal-ops handlers. Guarantees the caller has at
 * least one membership; `organizationIds` is the distinct, non-empty set
 * of org ids the caller can see and write within.
 *
 * This is deliberately a thin gate — "any membership = internal staff".
 * The schema CSV reference does not expose ops-specific role codes, so a
 * finer-grained gate (e.g. role code = "ops_sorter") cannot be enforced
 * without fabricating values. A later phase can tighten this by checking
 * specific role codes on `ctx.memberships[].roles[].code`.
 */
export interface OpsAuthedContext extends CurrentUserContext {
  organizationIds: string[];
}

export type OpsAuthedHandler = (
  req: Request,
  ctx: OpsAuthedContext
) => Promise<NextResponse>;

/**
 * Require an authenticated caller. Throws `UnauthenticatedError` when no
 * session is present — callers should compose with `withErrorHandling` (or
 * use `withAuthHandler` below) to render the standard error envelope.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: Request): Promise<NextResponse> => {
    const ctx = await getCurrentContext();
    if (!ctx) throw new UnauthenticatedError();
    return handler(req, ctx);
  };
}

/**
 * Convenience: auth + error envelope in one wrapper.
 */
export function withAuthHandler(handler: AuthedHandler) {
  return withErrorHandling(withAuth(handler));
}

/**
 * Require an authenticated caller who is also a donor. Throws
 * `UnauthenticatedError` when there is no session, or `ForbiddenError` when
 * the authenticated user has no donor row.
 */
export function withDonor(handler: DonorAuthedHandler) {
  return async (req: Request): Promise<NextResponse> => {
    const ctx = await getCurrentContext();
    if (!ctx) throw new UnauthenticatedError();
    if (!ctx.donor) {
      throw new ForbiddenError("Donor profile required for this endpoint");
    }
    return handler(req, { ...ctx, donor: ctx.donor });
  };
}

/**
 * Convenience: donor-auth + error envelope in one wrapper.
 * This is the canonical wrapper for every /api/v1/donor/* handler.
 */
export function withDonorHandler(handler: DonorAuthedHandler) {
  return withErrorHandling(withDonor(handler));
}

/**
 * Imperative variant for routes that need partial auth logic or want to
 * mix authenticated/unauthenticated branches.
 */
export async function requireUser(): Promise<CurrentUserContext> {
  const ctx = await getCurrentContext();
  if (!ctx) throw new UnauthenticatedError();
  return ctx;
}

/**
 * Imperative variant of `withDonor`. Returns a context whose `donor` is
 * guaranteed non-null.
 */
export async function requireDonor(): Promise<DonorAuthedContext> {
  const ctx = await requireUser();
  if (!ctx.donor) {
    throw new ForbiddenError("Donor profile required for this endpoint");
  }
  return { ...ctx, donor: ctx.donor };
}

/**
 * Require an authenticated caller who is also a courier. Throws
 * `UnauthenticatedError` when there is no session, or `ForbiddenError` when
 * the authenticated user has no courier row.
 */
export function withCourier(handler: CourierAuthedHandler) {
  return async (req: Request): Promise<NextResponse> => {
    const ctx = await getCurrentContext();
    if (!ctx) throw new UnauthenticatedError();
    if (!ctx.courier) {
      throw new ForbiddenError("Courier profile required for this endpoint");
    }
    return handler(req, { ...ctx, courier: ctx.courier });
  };
}

/**
 * Convenience: courier-auth + error envelope in one wrapper.
 * Canonical wrapper for every /api/v1/courier/* static handler.
 */
export function withCourierHandler(handler: CourierAuthedHandler) {
  return withErrorHandling(withCourier(handler));
}

/**
 * Imperative variant of `withCourier`. Returns a context whose `courier`
 * is guaranteed non-null. Use inside dynamic `[id]` routes where the
 * wrapper form can't capture the second route-context argument.
 */
export async function requireCourier(): Promise<CourierAuthedContext> {
  const ctx = await requireUser();
  if (!ctx.courier) {
    throw new ForbiddenError("Courier profile required for this endpoint");
  }
  return { ...ctx, courier: ctx.courier };
}

/**
 * Build the deduplicated list of organization ids the caller belongs to.
 */
function collectOrganizationIds(ctx: CurrentUserContext): string[] {
  return Array.from(new Set(ctx.memberships.map((m) => m.organizationId)));
}

/**
 * Require an authenticated caller with at least one membership (internal
 * staff). Throws `UnauthenticatedError` when there is no session, or
 * `ForbiddenError` when the user has no membership rows.
 *
 * ASSUMPTION: any membership counts as internal ops access. The CSV
 * schema reference does not expose ops-specific role codes, so a
 * finer-grained gate is deferred to a later phase.
 */
export function withOps(handler: OpsAuthedHandler) {
  return async (req: Request): Promise<NextResponse> => {
    const ctx = await getCurrentContext();
    if (!ctx) throw new UnauthenticatedError();
    const organizationIds = collectOrganizationIds(ctx);
    if (organizationIds.length === 0) {
      throw new ForbiddenError("Internal ops access required for this endpoint");
    }
    return handler(req, { ...ctx, organizationIds });
  };
}

/**
 * Convenience: ops-auth + error envelope in one wrapper.
 * Canonical wrapper for every /api/v1/ops/* static handler.
 */
export function withOpsHandler(handler: OpsAuthedHandler) {
  return withErrorHandling(withOps(handler));
}

/**
 * Imperative variant of `withOps`. Returns a context whose
 * `organizationIds` is guaranteed non-empty.
 */
export async function requireOps(): Promise<OpsAuthedContext> {
  const ctx = await requireUser();
  const organizationIds = collectOrganizationIds(ctx);
  if (organizationIds.length === 0) {
    throw new ForbiddenError("Internal ops access required for this endpoint");
  }
  return { ...ctx, organizationIds };
}
