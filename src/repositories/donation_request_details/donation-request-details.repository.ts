import "server-only";

/**
 * Donation request details repository.
 *
 * This repository never checks request ownership itself — the service
 * layer verifies the parent donation_request belongs to the donor BEFORE
 * calling into here. Keeping that check in one place (the service) means
 * the rule can't be bypassed by a new caller forgetting it.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonationRequestDetailRow } from "@modules/donor/request-details.dto";

const TABLE = "donation_request_details";

const SELECT_COLUMNS =
  "id, donation_request_id, donor_input_json, photos_count, " +
  "has_fragile_items, has_heavy_items, requires_special_handling, " +
  "additional_notes, created_at, updated_at";

export async function listByRequestId(
  donationRequestId: string
): Promise<DonationRequestDetailRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donation_request_id", donationRequestId)
    .order("created_at", { ascending: true });

  if (error) throw new DependencyError("Failed to list donation request details", error);
  return (data ?? []) as unknown as DonationRequestDetailRow[];
}

export interface CreateDonationRequestDetailDbInput {
  donation_request_id: string;
  donor_input_json: Record<string, unknown>;
  // NOT NULL in the DB; caller (service) must supply concrete values.
  photos_count: number;
  has_fragile_items: boolean;
  has_heavy_items: boolean;
  requires_special_handling: boolean;
  additional_notes: string | null;
}

export async function create(
  input: CreateDonationRequestDetailDbInput
): Promise<DonationRequestDetailRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create donation request detail", error);
  return data as unknown as DonationRequestDetailRow;
}
