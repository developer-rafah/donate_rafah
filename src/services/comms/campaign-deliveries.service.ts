import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import * as repo from "@repositories/campaign_deliveries/campaign-deliveries.repository";
import { assertCampaignInCallerOrgs } from "./communication-campaigns.service";
import {
  toCampaignDeliveryDto,
  type CampaignDeliveryDto,
} from "@modules/comms/campaign-deliveries.dto";

export async function listDeliveriesForCampaign(
  ctx: OpsAuthedContext,
  campaignId: string
): Promise<CampaignDeliveryDto[]> {
  await assertCampaignInCallerOrgs(ctx, campaignId);
  const rows = await repo.listByCampaignId(campaignId);
  return rows.map(toCampaignDeliveryDto);
}
