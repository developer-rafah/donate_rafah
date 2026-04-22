import "server-only";

/**
 * Bookings repository — donor-facing reads only.
 *
 * Bookings are scoped by parent donation_request; the caller (service) is
 * responsible for confirming that the request belongs to the donor before
 * asking for its bookings.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorBookingRow } from "@modules/donor/bookings.dto";

const TABLE = "bookings";

const SELECT_COLUMNS =
  "id, donation_request_id, schedule_slot_id, booking_status, booked_at, " +
  "rescheduled_from_booking_id, rescheduled_reason_ref_id, " +
  "cancelled_at, cancelled_by, " +
  "created_at, updated_at, created_by, updated_by";

export async function listByRequestId(
  donationRequestId: string
): Promise<DonorBookingRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("donation_request_id", donationRequestId)
    .order("created_at", { ascending: false });

  if (error) throw new DependencyError("Failed to list bookings", error);
  return (data ?? []) as unknown as DonorBookingRow[];
}
