/**
 * Notifications (ops-side) — DTO + create schema.
 *
 * Aligned to `public.notifications`. NOT NULL in DB:
 *   organization_id, notification_type, channel, message_body,
 *   status, payload_json, created_at, updated_at.
 *
 * This phase writes rows into the table but performs NO external
 * delivery — provider execution is out of scope. Service-owned fields:
 *   - `organization_id` derived from the template or the caller's
 *     single org; multi-org callers must supply it in the body and it
 *     must be one of the caller's orgs.
 *   - `created_by` = `ctx.user.id`.
 *   - `status` defaults to "draft" on create (ASSUMPTION; CSV has no
 *     visible check constraint).
 *   - `payload_json` defaults to `{}`.
 *
 * `sent_at`, `failed_at`, `failure_reason`, `scheduled_at` are NOT
 * writable on create in this phase — delivery scheduling belongs to a
 * later provider-execution phase.
 */

import { z } from "@lib/validation";

export interface OpsNotificationDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  templateId: string | null;
  notificationType: string;
  channel: string;
  targetType: string | null;
  targetId: string | null;
  subjectText: string | null;
  messageBody: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  payloadJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface OpsNotificationRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  template_id: string | null;
  notification_type: string;
  channel: string;
  target_type: string | null;
  target_id: string | null;
  subject_text: string | null;
  message_body: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function toOpsNotificationDto(row: OpsNotificationRow): OpsNotificationDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    templateId: row.template_id,
    notificationType: row.notification_type,
    channel: row.channel,
    targetType: row.target_type,
    targetId: row.target_id,
    subjectText: row.subject_text,
    messageBody: row.message_body,
    status: row.status,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,
    payloadJson: row.payload_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

/**
 * POST body. `created_by`, `status`, `sent_at`/`failed_at`/`failure_reason`
 * are NOT client-writable. `organization_id` is optional — service derives
 * it from `template_id` or from the caller's single org membership.
 * `scheduled_at` is kept writable because it's a plan-time field, not a
 * delivery outcome.
 */
export const createOpsNotificationSchema = z
  .object({
    organization_id: z.string().uuid().optional(),
    branch_id: z.string().uuid().optional(),
    template_id: z.string().uuid().optional(),
    notification_type: z.string().min(1).max(100),
    channel: z.string().min(1).max(100),
    target_type: z.string().max(100).optional(),
    target_id: z.string().uuid().optional(),
    subject_text: z.string().max(1000).optional(),
    message_body: z.string().min(1).max(16000),
    scheduled_at: z.string().datetime().optional(),
    payload_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 128, {
        message: "payload_json has too many top-level keys (max 128)",
      })
      .optional(),
  })
  .strict();

export type CreateOpsNotificationInput = z.infer<typeof createOpsNotificationSchema>;
