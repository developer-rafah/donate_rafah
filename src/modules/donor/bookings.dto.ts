/**
 * Bookings — donor-facing read DTO.
 *
 * Aligned to the real SQL contract:
 *   public.bookings (
 *     id,
 *     donation_request_id,
 *     schedule_slot_id,
 *     booking_status,
 *     booked_at,
 *     rescheduled_from_booking_id,
 *     rescheduled_reason_ref_id,
 *     cancelled_at,
 *     cancelled_by,
 *     created_at,
 *     updated_at,
 *     created_by,
 *     updated_by
 *   )
 *
 * Donor-facing list is scoped by parent donation_request ownership; no
 * write endpoints are exposed in this phase.
 *
 * `created_by`, `updated_by`, `cancelled_by` are omitted from the DTO —
 * those are internal operator references, not for donor consumption.
 */

export interface DonorBookingDto {
  id: string;
  donationRequestId: string;
  scheduleSlotId: string | null;
  bookingStatus: string;
  bookedAt: string | null;
  rescheduledFromBookingId: string | null;
  rescheduledReasonRefId: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DonorBookingRow {
  id: string;
  donation_request_id: string;
  schedule_slot_id: string | null;
  booking_status: string;
  booked_at: string | null;
  rescheduled_from_booking_id: string | null;
  rescheduled_reason_ref_id: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export function toDonorBookingDto(row: DonorBookingRow): DonorBookingDto {
  return {
    id: row.id,
    donationRequestId: row.donation_request_id,
    scheduleSlotId: row.schedule_slot_id,
    bookingStatus: row.booking_status,
    bookedAt: row.booked_at,
    rescheduledFromBookingId: row.rescheduled_from_booking_id,
    rescheduledReasonRefId: row.rescheduled_reason_ref_id,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
