/**
 * GET  /api/v1/ops/communication-campaigns
 * POST /api/v1/ops/communication-campaigns
 *
 * Creating a campaign does NOT automatically generate deliveries — the
 * `campaign_deliveries` endpoint remains read-only in this phase.
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listCampaigns,
  createCampaign,
} from "@services/comms/communication-campaigns.service";
import { createCommunicationCampaignSchema } from "@modules/comms/communication-campaigns.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listCampaigns(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createCommunicationCampaignSchema);
  const data = await createCampaign(ctx, input);
  return ok(data, { status: 201 });
});
