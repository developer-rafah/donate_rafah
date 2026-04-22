import "server-only";

/**
 * Donation requests repository.
 *
 * Writes are limited to create() with a server-assembled input object. The
 * repository does NOT know what the initial status is — that's resolved by
 * the service layer and passed in as `current_status_id`.
 *
 * Reads are gated by `donor_id` so the donor-facing service cannot surface
 * other donors' requests even if a caller passes a foreign id.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonationRequestRow } from "@modules/donor/requests.dto";

const TABLE = "donation_requests";

const SELECT_COLUMNS =
  "id, organization_id, branch_id, donor_id, request_number, " +
  "donation_type_ref_id, donation_category_ref_id, pickup_location_id, " +
  "current_status_id, priority_level, " +
  "summary_description, estimated_quantity_text, donor_notes, source_channel, " +
  "submitted_at, closed_at, cancelled_at, cancellation_reason_ref_id, " +
  "created_at, updated_at, created_by, updated_by";

export async function listByDonorId(donorId: string): Promise<DonationRequestRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donor_id", donorId)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list donation requests", error);
  return (data ?? []) as unknown as DonationRequestRow[];
}

export async function findOwnedById(
  donorId: string,
  id: string
): Promise<DonationRequestRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .eq("donor_id", donorId)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load donation request", error);
  return (data as unknown as DonationRequestRow) ?? null;
}

/**
 * Complete shape the service layer must provide. NOT-NULL columns listed
 * here are required at insert time; the repository never invents values.
 *
 * Per the canonical schema:
 *   NOT NULL: organization_id, donor_id, request_number, pickup_location_id,
 *             priority_level, source_channel, submitted_at
 *   NULL:     branch_id, donation_type_ref_id, donation_category_ref_id,
 *             current_status_id, summary_description, estimated_quantity_text,
 *             donor_notes, closed_at, cancelled_at, cancellation_reason_ref_id
 *
 * `cancellation_reason_ref_id` is always null on donor-initiated creation.
 * The service layer is responsible for generating `request_number`,
 * stamping `submitted_at`, and choosing `priority_level` + `source_channel`.
 */
export interface CreateDonationRequestDbInput {
  organization_id: string;
  branch_id: string | null;
  donor_id: string;
  request_number: string;
  pickup_location_id: string;
  donation_type_ref_id: string | null;
  donation_category_ref_id: string | null;
  current_status_id: string | null;
  priority_level: string;
  summary_description: string | null;
  estimated_quantity_text: string | null;
  donor_notes: string | null;
  source_channel: string;
  submitted_at: string;
  cancellation_reason_ref_id: string | null;
}

export async function create(
  input: CreateDonationRequestDbInput
): Promise<DonationRequestRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new DependencyError("Failed to create donation request", error);
  return data as unknown as DonationRequestRow;
}

/**
 * Minimal shape used by upstream-linkage checks (ops/sorting flow, etc.).
 * Keeps the surface narrow so internal callers don't depend on the full
 * DonationRequestRow unnecessarily.
 */
export interface DonationRequestScopeRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  donor_id: string;
}

/**
 * Read-only: load just the org scope for a donation request. Used by ops
 * services to verify the request belongs to one of the caller's orgs
 * before creating dependent rows (sorting sessions, etc.).
 */
export async function findScopeById(id: string): Promise<DonationRequestScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, branch_id, donor_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load donation request scope", error);
  return (data as unknown as DonationRequestScopeRow) ?? null;
}
