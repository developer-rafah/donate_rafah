/**
 * POST /api/v1/ops/workflow-instances/[id]/advance
 *
 * Advances a workflow instance one transition. Actor identity is taken
 * from the auth context; the instance id is taken from the route param;
 * the body carries only the (optional) transition selector, notes, and
 * automation-action reference for logging.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import { advanceWorkflowInstance } from "@services/workflow/progression.service";
import { advanceWorkflowInstanceSchema } from "@modules/workflow/instances.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, advanceWorkflowInstanceSchema);
  const data = await advanceWorkflowInstance(ctx, id, input);
  return ok(data);
});
