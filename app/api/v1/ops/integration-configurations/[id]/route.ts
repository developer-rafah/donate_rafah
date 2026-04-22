/**
 * GET   /api/v1/ops/integration-configurations/[id]
 * PATCH /api/v1/ops/integration-configurations/[id]
 *
 * PATCH accepts a sparse update. `provider_id` and `organization_id`
 * are NOT patchable — the Zod schema omits them, so any attempt to
 * change them is a validation error.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  getIntegrationConfiguration,
  updateIntegrationConfiguration,
} from "@services/integrations/integration-configurations.service";
import { updateIntegrationConfigurationSchema } from "@modules/integrations/integration-configurations.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getIntegrationConfiguration(ctx, id);
  return ok(data);
});

export const PATCH = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, updateIntegrationConfigurationSchema);
  const data = await updateIntegrationConfiguration(ctx, id, input);
  return ok(data);
});
