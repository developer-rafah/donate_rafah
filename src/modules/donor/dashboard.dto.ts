/**
 * Donor dashboard — wire DTO.
 *
 * The totals on this payload come directly from canonical counters:
 *   - points       ← donors.total_points
 *   - donations    ← donors.total_donations_count
 *   - badges       ← count(badge_awards) for donor
 *   - certificates ← count(issued_certificates) for donor
 *
 * `latestRequest` remains null — surfacing the latest donation request
 * summary is a presentation concern that can be added without breaking
 * the envelope.
 */

import type { DonorProfileDto } from "./profile.dto";

export interface DonorDashboardDto {
  profile: DonorProfileDto;
  totals: {
    points: number;
    badges: number;
    certificates: number;
    donations: number;
  };
  latestRequest: null;
}
