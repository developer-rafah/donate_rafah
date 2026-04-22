import "server-only";

/**
 * Campaign deliveries repository — read-only.
 *
 * Scoped by parent `campaign_id`. Service verifies the parent campaign
 * is in the caller's org set before calling in.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CampaignDeliveryRow } from "@modules/comms/campaign-deliveries.dto";

const TABLE = "campaign_deliveries";

const SELECT_COLUMNS =
  "id, campaign_id, recipient_type, recipient_id, notification_id, " +
  "delivery_status, sent_at, delivered_at, read_at, failed_at, " +
  "failure_reason, created_at, updated_at";

export async function listByCampaignId(
  campaignId: string
): Promise<CampaignDeliveryRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list campaign deliveries", error);
  return (data ?? []) as unknown as CampaignDeliveryRow[];
}
