/**
 * GET /api/v1/me
 *
 * Returns the resolved current-user context for the authenticated caller:
 *   - application user row
 *   - donor profile (if any)
 *   - courier profile (if any)
 *   - memberships with roles
 *
 * Unauthenticated callers receive the standard UNAUTHENTICATED error envelope.
 * This is the Phase 2 proof-of-life endpoint.
 */

import { ok } from "@lib/http/response";
import { withAuthHandler } from "@lib/auth";
import { getMe } from "@services/auth/auth.service";

export const dynamic = "force-dynamic";

export const GET = withAuthHandler(async () => {
  const me = await getMe();
  return ok(me);
});
