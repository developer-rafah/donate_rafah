import "server-only";

/**
 * Notifications repository — donor-facing reads only.
 *
 * The real schema stores per-recipient delivery state in
 * `public.notification_recipients` with BOTH a `user_id` and a `donor_id`
 * column. Either may be populated depending on how the notification was
 * addressed — we OR the two filters so donors see notifications addressed
 * to them via either link. The DTO/service filters out any row whose parent
 * notification was deleted.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorNotificationRow } from "@modules/donor/notifications.dto";

const TABLE = "notification_recipients";

const RECIPIENT_COLUMNS =
  "id, notification_id, delivery_status, delivered_at, read_at, " +
  "notifications ( id, subject_text, message_body, notification_type, channel, created_at )";

export async function listForDonorOrUser(
  donorId: string,
  userId: string
): Promise<DonorNotificationRow[]> {
  const supabase = await createSupabaseServerClient();

  // PostgREST `.or()` combines filters with a logical OR. This matches any
  // row whose donor_id is the caller's donor OR whose user_id is the caller.
  const { data, error } = await supabase
    .from(TABLE)
    .select(RECIPIENT_COLUMNS)
    .or(`donor_id.eq.${donorId},user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new DependencyError("Failed to list notifications for donor", error);
  }
  return (data ?? []) as unknown as DonorNotificationRow[];
}
