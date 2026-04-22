/**
 * GET /api/v1/ops/templates
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listTemplates } from "@services/comms/templates.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listTemplates(ctx);
  return ok(data);
});
