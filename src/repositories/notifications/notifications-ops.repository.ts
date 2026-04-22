import "server-only";

/**
 * Notifications — ops-side reads + create.
 *
 * Kept in a separate file from `notifications.repository.ts` because
 * the donor-facing reads there use a recipient-joined shape (one row
 * per user/donor delivery). This file operates on the parent
 * `notifications` table directly — list/find/create for internal ops.
 *
 * Org-scoped directly via `organization_id`.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { OpsNotificationRow } from "@modules/comms/notifications.dto";

const TABLE = "notifications";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, template_id, notification_type, channel, " +
  "target_type, target_id, subject_text, message_body, status, " +
  "scheduled_at, sent_at, failed_at, failure_reason, payload_json, " +
  "created_at, updated_at, created_by";

export async function listInOrgs(orgIds: string[]): Promise<OpsNotificationRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list notifications", error);
  return (data ?? []) as unknown as OpsNotificationRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<OpsNotificationRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load notification", error);
  return (data as unknown as OpsNotificationRow) ?? null;
}

/**
 * Full NOT-NULL-safe insert payload. Delivery-outcome fields
 * (`sent_at`, `failed_at`, `failure_reason`) are NOT part of this shape
 * — they're owned by the provider-execution phase.
 */
export interface CreateOpsNotificationDbInput {
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
  payload_json: Record<string, unknown>;
  created_by: string | null;
}

export async function create(
  input: CreateOpsNotificationDbInput
): Promise<OpsNotificationRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create notification", error);
  return data as unknown as OpsNotificationRow;
}
