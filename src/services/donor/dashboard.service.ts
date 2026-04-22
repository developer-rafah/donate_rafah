import "server-only";

/**
 * Donor dashboard service.
 *
 * Aggregates the donor profile plus totals visible on the dashboard.
 * Runs the three count queries and the profile read in parallel to keep
 * latency reasonable.
 *
 * Fields tied to entities not yet implemented in this phase
 * (`totals.donations`, `latestRequest`) are intentionally `null` — see
 * `DonorDashboardDto` for the contract.
 */

import type { DonorAuthedContext } from "@lib/auth";
import * as donorsRepo from "@repositories/donors/donors.repository";
import * as badgesRepo from "@repositories/badges/badges.repository";
import * as certificatesRepo from "@repositories/certificates/certificates.repository";
import { getDonorProfile } from "./profile.service";
import type { DonorDashboardDto } from "@modules/donor/dashboard.dto";

export async function getDonorDashboard(
  ctx: DonorAuthedContext
): Promise<DonorDashboardDto> {
  // `public.donors` already maintains `total_points` and
  // `total_donations_count` as NOT-NULL counters — read them directly
  // instead of re-aggregating the ledger from the donor API.
  const [profile, counters, badges, certificates] = await Promise.all([
    getDonorProfile(ctx),
    donorsRepo.findCounters(ctx.donor.id),
    badgesRepo.countByDonorId(ctx.donor.id),
    certificatesRepo.countByDonorId(ctx.donor.id),
  ]);

  return {
    profile,
    totals: {
      points: counters.totalPoints,
      badges,
      certificates,
      donations: counters.totalDonationsCount,
    },
    latestRequest: null,
  };
}
