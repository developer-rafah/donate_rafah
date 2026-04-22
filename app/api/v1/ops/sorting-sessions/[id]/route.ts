/**
 * GET   /api/v1/ops/sorting-sessions/[id]
 * PATCH /api/v1/ops/sorting-sessions/[id]
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  getSortingSession,
  updateSortingSession,
} from "@services/ops/sorting-sessions.service";
import { updateSortingSessionSchema } from "@modules/ops/sorting-sessions.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getSortingSession(ctx, id);
  return ok(data);
});

export const PATCH = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, updateSortingSessionSchema);
  const data = await updateSortingSession(ctx, id, input);
  return ok(data);
});
