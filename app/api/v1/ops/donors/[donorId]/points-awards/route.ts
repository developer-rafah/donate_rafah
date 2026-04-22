/**
 * POST /api/v1/ops/donors/[donorId]/points-awards
 *
 * Append-only ledger write. `donor_id` from route; `organization_id`,
 * `balance_after`, `created_by`, `ledger_type` (when omitted), and
 * `awarded_at` (when omitted) are all server-derived. Also UPDATEs
 * `donors.total_points` to keep the maintained counter aligned.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import { createPointsAward } from "@services/recognition/points.service";
import { createPointsAwardSchema } from "@modules/recognition/points.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ donorId: string }> };

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { donorId } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createPointsAwardSchema);
  const data = await createPointsAward(ctx, donorId, input);
  return ok(data, { status: 201 });
});
