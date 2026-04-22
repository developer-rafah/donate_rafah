/**
 * GET /api/v1/ops/points-rules
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listPointsRules } from "@services/recognition/points-rules.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listPointsRules(ctx);
  return ok(data);
});
