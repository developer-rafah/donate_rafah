/**
 * GET /api/v1/ops/points-ledger
 *
 * All ledger entries across the caller's org set, newest first.
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listPointsLedger } from "@services/recognition/points.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listPointsLedger(ctx);
  return ok(data);
});
