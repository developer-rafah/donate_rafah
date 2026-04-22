import "server-only";

/**
 * Notifications — ops-side service.
 *
 * Owns `assertNotificationInCallerOrgs` for child resources
 * (recipients). Create path resolves organization_id via
 * `resolveTargetOrgId` and verifies any referenced template is in the
 * caller's orgs.
 *
 * This phase writes DB rows only — no external delivery side effects.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError, NotFoundError } from "@lib/errors";
import * as notificationsRepo from "@repositories/notifications/notifications-ops.repository";
import * as templatesRepo from "@repositories/templates/templates.repository";
import { OPS_NOTIFICATION_DEFAULT_STATUS, resolveTargetOrgId } from "@domain/comms/rules";
import {
  toOpsNotificationDto,
  type CreateOpsNotificationInput,
  type OpsNotificationDto,
  type OpsNotificationRow,
} from "@modules/comms/notifications.dto";

export async function assertNotificationInCallerOrgs(
  ctx: OpsAuthedContext,
  id: string
): Promise<OpsNotificationRow> {
  const row = await notificationsRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Notification not found");
  return row;
}

export async function listOpsNotifications(
  ctx: OpsAuthedContext
): Promise<OpsNotificationDto[]> {
  const rows = await notificationsRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toOpsNotificationDto);
}

export async function getOpsNotification(
  ctx: OpsAuthedContext,
  id: string
): Promise<OpsNotificationDto> {
  const row = await assertNotificationInCallerOrgs(ctx, id);
  return toOpsNotificationDto(row);
}

export async function createOpsNotification(
  ctx: OpsAuthedContext,
  input: CreateOpsNotificationInput
): Promise<OpsNotificationDto> {
  // If a template is referenced, verify it belongs to the caller's orgs
  // and use its org as the derived candidate. Otherwise the derived org
  // is null.
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

  const row = await notificationsRepo.create({
    organization_id: resolvedOrgId,
    branch_id: input.branch_id ?? null,
    template_id: input.template_id ?? null,
    notification_type: input.notification_type,
    channel: input.channel,
    target_type: input.target_type ?? null,
    target_id: input.target_id ?? null,
    subject_text: input.subject_text ?? null,
    message_body: input.message_body,
    // Status + payload defaults applied here, not in the DB.
    status: OPS_NOTIFICATION_DEFAULT_STATUS,
    scheduled_at: input.scheduled_at ?? null,
    payload_json: input.payload_json ?? {},
    created_by: ctx.user.id,
  });

  return toOpsNotificationDto(row);
}
