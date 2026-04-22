/**
 * GET /api/v1/ops/external-api-logs
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listExternalApiLogs } from "@services/integrations/external-api-logs.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listExternalApiLogs(ctx);
  return ok(data);
});
