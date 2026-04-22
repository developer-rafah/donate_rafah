/**
 * GET   /api/v1/ops/sorting-review-tasks/[id]
 * PATCH /api/v1/ops/sorting-review-tasks/[id]
 *
 * PATCH intentionally does not enforce status-transition legality in
 * this phase — workflow rules belong to a later phase.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  getReviewTask,
  updateReviewTask,
} from "@services/ops/review-tasks.service";
import { updateReviewTaskSchema } from "@modules/ops/review-tasks.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getReviewTask(ctx, id);
  return ok(data);
});

export const PATCH = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, updateReviewTaskSchema);
  const data = await updateReviewTask(ctx, id, input);
  return ok(data);
});
