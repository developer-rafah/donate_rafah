/**
 * GET /api/v1/ops/template-types
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listTemplateTypes } from "@services/comms/template-types.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listTemplateTypes(ctx);
  return ok(data);
});
