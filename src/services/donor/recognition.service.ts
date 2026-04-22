import "server-only";

/**
 * Donor recognition services — points ledger, badge awards, issued
 * certificates. All reads are donor-scoped; writes are not exposed by this
 * phase (issuance belongs to the points/badge/certificate engines).
 */

import type { DonorAuthedContext } from "@lib/auth";
import * as pointsRepo from "@repositories/points/points.repository";
import * as badgesRepo from "@repositories/badges/badges.repository";
import * as certificatesRepo from "@repositories/certificates/certificates.repository";
import {
  toDonorPointsLedgerEntryDto,
  toDonorBadgeAwardDto,
  toDonorCertificateDto,
  type DonorPointsLedgerEntryDto,
  type DonorBadgeAwardDto,
  type DonorCertificateDto,
} from "@modules/donor/recognition.dto";

export async function listDonorPoints(
  ctx: DonorAuthedContext
): Promise<DonorPointsLedgerEntryDto[]> {
  const rows = await pointsRepo.listByDonorId(ctx.donor.id);
  return rows.map(toDonorPointsLedgerEntryDto);
}

export async function listDonorBadges(
  ctx: DonorAuthedContext
): Promise<DonorBadgeAwardDto[]> {
  const rows = await badgesRepo.listByDonorId(ctx.donor.id);
  return rows.map(toDonorBadgeAwardDto);
}

export async function listDonorCertificates(
  ctx: DonorAuthedContext
): Promise<DonorCertificateDto[]> {
  const rows = await certificatesRepo.listByDonorId(ctx.donor.id);
  return rows.map(toDonorCertificateDto);
}
