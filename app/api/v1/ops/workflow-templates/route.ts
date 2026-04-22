/**
 * GET /api/v1/ops/workflow-templates
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listWorkflowTemplates } from "@services/workflow/templates.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listWorkflowTemplates(ctx);
  return ok(data);
});
