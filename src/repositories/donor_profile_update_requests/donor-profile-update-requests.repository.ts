import "server-only";

/**
 * Donor profile update requests repository.
 *
 * The real schema makes `status` and `submitted_at` NOT NULL. `submitted_at`
 * is supplied at insert time by the service. `status` is expected to be
 * DB-defaulted (schema has no visible trigger filling it — see the trigger
 * reference CSV) but if a deployment lacks the default, the service layer
 * is where to add a supplied value. For Phase 4 alignment we do NOT write
 * status from the client path; the approval workflow owns transitions.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorProfileUpdateRequestRow } from "@modules/donor/profile-update-requests.dto";

const TABLE = "donor_profile_update_requests";

const SELECT_COLUMNS =
  "id, donor_id, requested_by_user_id, request_type, " +
  "current_data_json, requested_data_json, status, " +
  "submitted_at, reviewed_at, reviewed_by, review_notes, " +
  "created_at, updated_at";

export async function listByDonorId(
  donorId: string
): Promise<DonorProfileUpdateRequestRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donor_id", donorId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new DependencyError("Failed to list donor profile update requests", error);
  }
  return (data ?? []) as unknown as DonorProfileUpdateRequestRow[];
}

export interface CreateDonorProfileUpdateRequestDbInput {
  donor_id: string;
  requested_by_user_id: string;
  request_type: string;
  current_data_json: Record<string, unknown>;
  requested_data_json: Record<string, unknown>;
  submitted_at: string;
}

export async function create(
  input: CreateDonorProfileUpdateRequestDbInput
): Promise<DonorProfileUpdateRequestRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw new DependencyError("Failed to create donor profile update request", error);
  }
  return data as unknown as DonorProfileUpdateRequestRow;
}
