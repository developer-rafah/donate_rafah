/**
 * GET  /api/v1/courier/tasks/[id]/updates  — list field updates
 * POST /api/v1/courier/tasks/[id]/updates  — create a field update
 *
 * Ownership: the parent task must belong to the caller via an active
 * assignment (verified in the service). `field_task_id` and `courier_id`
 * are never accepted from the body — they are derived from the route and
 * context.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireCourier } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listFieldUpdatesForTask,
  createFieldUpdateForTask,
} from "@services/courier/field-updates.service";
import { createFieldUpdateSchema } from "@modules/courier/field-updates.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const data = await listFieldUpdatesForTask(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const input = await parseJsonBody(req, createFieldUpdateSchema);
  const data = await createFieldUpdateForTask(ctx, id, input);
  return ok(data, { status: 201 });
});
