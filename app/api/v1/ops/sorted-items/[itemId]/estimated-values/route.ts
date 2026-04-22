/**
 * GET  /api/v1/ops/sorted-items/[itemId]/estimated-values
 * POST /api/v1/ops/sorted-items/[itemId]/estimated-values
 *
 * Both handlers first verify the parent sorted item belongs to a session
 * the caller can see (NOT_FOUND otherwise). `sorting_session_id` is
 * derived from the parent item — never accepted from the body.
 * Approval fields (`approved_by`, `approved_at`) are intentionally NOT
 * writable in this phase.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listEstimatedValuesForItem,
  createEstimatedValueForItem,
} from "@services/ops/estimated-values.service";
import { createEstimatedValueSchema } from "@modules/ops/estimated-values.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ itemId: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { itemId } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listEstimatedValuesForItem(ctx, itemId);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { itemId } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createEstimatedValueSchema);
  const data = await createEstimatedValueForItem(ctx, itemId, input);
  return ok(data, { status: 201 });
});
