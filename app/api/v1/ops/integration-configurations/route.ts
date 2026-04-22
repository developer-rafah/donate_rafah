/**
 * GET  /api/v1/ops/integration-configurations
 * POST /api/v1/ops/integration-configurations
 *
 * GET applies secret redaction to `config_payload_json` (common
 * credential-shaped top-level keys → "[REDACTED]"). POST accepts the
 * full payload; `organization_id` is derived from the referenced
 * provider and never accepted from the body.
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listIntegrationConfigurations,
  createIntegrationConfiguration,
} from "@services/integrations/integration-configurations.service";
import { createIntegrationConfigurationSchema } from "@modules/integrations/integration-configurations.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listIntegrationConfigurations(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createIntegrationConfigurationSchema);
  const data = await createIntegrationConfiguration(ctx, input);
  return ok(data, { status: 201 });
});
