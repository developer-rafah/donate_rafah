import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/webhook_events/webhook-events.repository";
import {
  toWebhookEventDto,
  type WebhookEventDto,
} from "@modules/integrations/logs.dto";

export async function listWebhookEvents(
  ctx: OpsAuthedContext
): Promise<WebhookEventDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toWebhookEventDto);
}

export async function getWebhookEvent(
  ctx: OpsAuthedContext,
  id: string
): Promise<WebhookEventDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Webhook event not found");
  return toWebhookEventDto(row);
}
