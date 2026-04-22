/**
 * POST /api/v1/ops/donors/[donorId]/badge-awards
 *
 * One award per (badge, donor) — enforced at the app layer because no
 * DB unique constraint is visible. `awarded_by` set from context.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import { createBadgeAward } from "@services/recognition/badges.service";
import { createBadgeAwardSchema } from "@modules/recognition/badges.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ donorId: string }> };

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { donorId } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createBadgeAwardSchema);
  const data = await createBadgeAward(ctx, donorId, input);
  return ok(data, { status: 201 });
});
