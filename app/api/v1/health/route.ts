/**
 * GET /api/v1/health
 *
 * Unauthenticated liveness endpoint. Returns the standard success envelope
 * so clients can smoke-test the response shape without a session.
 */

import { ok, withErrorHandling } from "@lib/http/response";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  return ok({
    status: "ok",
    service: "rafd",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
});
