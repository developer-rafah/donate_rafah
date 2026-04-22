/**
 * GET /api/v1/ops/integration-providers
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listIntegrationProviders } from "@services/integrations/integration-providers.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listIntegrationProviders(ctx);
  return ok(data);
});
