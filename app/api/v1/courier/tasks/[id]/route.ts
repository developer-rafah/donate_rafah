/**
 * GET /api/v1/courier/tasks/[id]
 *
 * Returns one field task owned by the caller via an active assignment.
 * NOT_FOUND for missing tasks or tasks not owned by the caller — we never
 * distinguish the two cases externally.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireCourier } from "@lib/auth";
import { getCourierTask } from "@services/courier/tasks.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const data = await getCourierTask(ctx, id);
  return ok(data);
});
