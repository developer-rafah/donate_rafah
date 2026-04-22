import "server-only";

/**
 * Communication campaigns repository.
 *
 * Org-scoped directly via `organization_id`.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CommunicationCampaignRow } from "@modules/comms/communication-campaigns.dto";

const TABLE = "communication_campaigns";

const SELECT_COLUMNS =
  "id, organization_id, campaign_code, name_ar, name_en, description, " +
  "campaign_type, target_type, target_filter_json, template_id, channel, " +
  "campaign_status, scheduled_at, started_at, completed_at, " +
  "created_at, updated_at, created_by";

export async function listInOrgs(
  orgIds: string[]
): Promise<CommunicationCampaignRow[]> {
  if (orgIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list campaigns", error);
  return (data ?? []) as unknown as CommunicationCampaignRow[];
}

export async function findByIdInOrgs(
  id: string,
  orgIds: string[]
): Promise<CommunicationCampaignRow | null> {
  if (orgIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .in("organization_id", orgIds)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load campaign", error);
  return (data as unknown as CommunicationCampaignRow) ?? null;
}

export interface CreateCampaignDbInput {
  organization_id: string;
  campaign_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  campaign_type: string;
  target_type: string;
  target_filter_json: Record<string, unknown>;
  template_id: string | null;
  channel: string;
  campaign_status: string;
  scheduled_at: string | null;
  created_by: string | null;
}

export async function create(
  input: CreateCampaignDbInput
): Promise<CommunicationCampaignRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create campaign", error);
  return data as unknown as CommunicationCampaignRow;
}
