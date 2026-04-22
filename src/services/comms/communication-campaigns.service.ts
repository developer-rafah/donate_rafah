import "server-only";

/**
 * Communication campaigns service.
 *
 * Owns `assertCampaignInCallerOrgs` used by the deliveries child
 * resource. Create path resolves `organization_id` via
 * `resolveTargetOrgId` and verifies any referenced template is in the
 * caller's orgs.
 *
 * Creating a campaign does NOT automatically generate deliveries — the
 * deliveries layer is produced by the provider-execution phase.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError, NotFoundError } from "@lib/errors";
import * as campaignsRepo from "@repositories/communication_campaigns/communication-campaigns.repository";
import * as templatesRepo from "@repositories/templates/templates.repository";
import { OPS_CAMPAIGN_DEFAULT_STATUS, resolveTargetOrgId } from "@domain/comms/rules";
import {
  toCommunicationCampaignDto,
  type CommunicationCampaignDto,
  type CommunicationCampaignRow,
  type CreateCommunicationCampaignInput,
} from "@modules/comms/communication-campaigns.dto";

export async function assertCampaignInCallerOrgs(
  ctx: OpsAuthedContext,
  id: string
): Promise<CommunicationCampaignRow> {
  const row = await campaignsRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Campaign not found");
  return row;
}

export async function listCampaigns(
  ctx: OpsAuthedContext
): Promise<CommunicationCampaignDto[]> {
  const rows = await campaignsRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toCommunicationCampaignDto);
}

export async function getCampaign(
  ctx: OpsAuthedContext,
  id: string
): Promise<CommunicationCampaignDto> {
  const row = await assertCampaignInCallerOrgs(ctx, id);
  return toCommunicationCampaignDto(row);
}

export async function createCampaign(
  ctx: OpsAuthedContext,
  input: CreateCommunicationCampaignInput
): Promise<CommunicationCampaignDto> {
  let derivedOrgId: string | null = null;
  if (input.template_id) {
    const tmpl = await templatesRepo.findScopeById(input.template_id);
    if (!tmpl || !ctx.organizationIds.includes(tmpl.organization_id)) {
      throw new NotFoundError("Template not found");
    }
    derivedOrgId = tmpl.organization_id;
  }

  const resolvedOrgId = resolveTargetOrgId({
    explicit: input.organization_id ?? null,
    derived: derivedOrgId,
    callerOrgs: ctx.organizationIds,
  });
  if (!resolvedOrgId) {
    throw new BadRequestError(
      "organization_id is ambiguous or not in caller's org set — supply it explicitly"
    );
  }

  const row = await campaignsRepo.create({
    organization_id: resolvedOrgId,
    campaign_code: input.campaign_code,
    name_ar: input.name_ar,
    name_en: input.name_en ?? null,
    description: input.description ?? null,
    campaign_type: input.campaign_type,
    target_type: input.target_type,
    // NOT NULL in DB; default to empty object when client omits it.
    target_filter_json: input.target_filter_json ?? {},
    template_id: input.template_id ?? null,
    channel: input.channel,
    campaign_status: OPS_CAMPAIGN_DEFAULT_STATUS,
    scheduled_at: input.scheduled_at ?? null,
    created_by: ctx.user.id,
  });

  return toCommunicationCampaignDto(row);
}
