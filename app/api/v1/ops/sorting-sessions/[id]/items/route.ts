/**
 * GET  /api/v1/ops/sorting-sessions/[id]/items
 * POST /api/v1/ops/sorting-sessions/[id]/items
 *
 * Session id from the route is the authoritative binding — `sorting_session_id`
 * is NEVER accepted from the body.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listSortedItems,
  createSortedItem,
} from "@services/ops/sorted-items.service";
import { createSortedItemSchema } from "@modules/ops/sorted-items.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listSortedItems(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createSortedItemSchema);
  const data = await createSortedItem(ctx, id, input);
  return ok(data, { status: 201 });
});
