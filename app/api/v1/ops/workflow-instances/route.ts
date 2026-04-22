/**
 * GET  /api/v1/ops/workflow-instances
 * POST /api/v1/ops/workflow-instances
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listWorkflowInstances,
  createWorkflowInstance,
} from "@services/workflow/instances.service";
import { createWorkflowInstanceSchema } from "@modules/workflow/instances.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listWorkflowInstances(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createWorkflowInstanceSchema);
  const data = await createWorkflowInstance(ctx, input);
  return ok(data, { status: 201 });
});
