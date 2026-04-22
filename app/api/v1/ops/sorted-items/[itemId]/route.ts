/**
 * PATCH /api/v1/ops/sorted-items/[itemId]
 *
 * Updates a sorted item. Ownership is enforced via the caller's
 * session-id set (derived from their org memberships) — a foreign
 * item maps to NOT_FOUND.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import { updateSortedItem } from "@services/ops/sorted-items.service";
import { updateSortedItemSchema } from "@modules/ops/sorted-items.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ itemId: string }> };

export const PATCH = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { itemId } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, updateSortedItemSchema);
  const data = await updateSortedItem(ctx, itemId, input);
  return ok(data);
});
