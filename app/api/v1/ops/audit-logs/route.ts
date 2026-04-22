/**
 * GET /api/v1/ops/audit-logs
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listAuditLogs } from "@services/audit/audit-logs.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listAuditLogs(ctx);
  return ok(data);
});
