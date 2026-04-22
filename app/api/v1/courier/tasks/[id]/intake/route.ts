/**
 * GET   /api/v1/courier/tasks/[id]/intake  — read the intake record (nullable)
 * POST  /api/v1/courier/tasks/[id]/intake  — create the intake record
 * PATCH /api/v1/courier/tasks/[id]/intake  — update the intake record
 *
 * One intake per task. POST fails with CONFLICT when a record already
 * exists; PATCH fails with NOT_FOUND when one does not. Identity fields
 * (`organization_id`, `donation_request_id`, `field_task_id`,
 * `courier_id`, `branch_id`) are derived server-side.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireCourier } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  getIntakeForTask,
  createIntakeForTask,
  updateIntakeForTask,
} from "@services/courier/intake.service";
import { createIntakeSchema, updateIntakeSchema } from "@modules/courier/intake.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const data = await getIntakeForTask(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const input = await parseJsonBody(req, createIntakeSchema);
  const data = await createIntakeForTask(ctx, id, input);
  return ok(data, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const input = await parseJsonBody(req, updateIntakeSchema);
  const data = await updateIntakeForTask(ctx, id, input);
  return ok(data);
});
