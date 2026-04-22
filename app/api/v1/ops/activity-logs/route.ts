/**
 * GET /api/v1/ops/activity-logs
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listActivityLogs } from "@services/audit/activity-logs.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listActivityLogs(ctx);
  return ok(data);
});
