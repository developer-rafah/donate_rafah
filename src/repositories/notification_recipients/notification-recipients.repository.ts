import "server-only";

/**
 * Notification recipients — ops-side reads + create.
 *
 * Scoped by parent `notification_id`. Service verifies the parent
 * notification is in the caller's org set before calling in.
 *
 * Delivery-outcome fields (`delivered_at`, `read_at`, `failure_reason`)
 * are NOT writable here — those are updated by the provider-execution
 * phase.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { OpsNotificationRecipientRow } from "@modules/comms/notification-recipients.dto";

const TABLE = "notification_recipients";

const SELECT_COLUMNS =
  "id, notification_id, user_id, donor_id, recipient_name, " +
  "recipient_phone, recipient_email, delivery_status, " +
  "delivered_at, read_at, failure_reason, created_at, updated_at";

export async function listByNotificationId(
  notificationId: string
): Promise<OpsNotificationRecipientRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("notification_id", notificationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new DependencyError("Failed to list notification recipients", error);
  }
  return (data ?? []) as unknown as OpsNotificationRecipientRow[];
}

export interface CreateRecipientDbInput {
  notification_id: string;
  user_id: string | null;
  donor_id: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  delivery_status: string;
}

export async function create(
  input: CreateRecipientDbInput
): Promise<OpsNotificationRecipientRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create recipient", error);
  return data as unknown as OpsNotificationRecipientRow;
}
