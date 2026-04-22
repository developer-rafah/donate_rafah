import "server-only";

/**
 * Badges service — read + award.
 *
 * Awarding flow:
 *   1. Verify donor belongs to one of the caller's orgs.
 *   2. Verify badge belongs to the donor's org AND is active.
 *   3. Reject if a prior award exists for the same (badge, donor) —
 *      enforced at the app layer because the CSV shows no unique
 *      constraint on (badge_id, donor_id).
 *   4. Insert the append-only award row.
 */

import type { OpsAuthedContext } from "@lib/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@lib/errors";
import * as badgesRepo from "@repositories/badges/badges-ops.repository";
import * as donorsRepo from "@repositories/donors/donors.repository";
import {
  toOpsBadgeAwardDto,
  toOpsBadgeDto,
  type CreateBadgeAwardInput,
  type OpsBadgeAwardDto,
  type OpsBadgeDto,
} from "@modules/recognition/badges.dto";

export async function listBadges(ctx: OpsAuthedContext): Promise<OpsBadgeDto[]> {
  const rows = await badgesRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toOpsBadgeDto);
}

export async function getBadge(
  ctx: OpsAuthedContext,
  id: string
): Promise<OpsBadgeDto> {
  const row = await badgesRepo.findBadgeByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Badge not found");
  return toOpsBadgeDto(row);
}

async function assertDonorInCallerOrgs(ctx: OpsAuthedContext, donorId: string) {
  const donor = await donorsRepo.findScopeById(donorId);
  if (!donor || !ctx.organizationIds.includes(donor.organization_id)) {
    throw new NotFoundError("Donor not found");
  }
  return donor;
}

export async function listDonorBadges(
  ctx: OpsAuthedContext,
  donorId: string
): Promise<OpsBadgeAwardDto[]> {
  await assertDonorInCallerOrgs(ctx, donorId);
  const rows = await badgesRepo.listAwardsByDonorId(donorId);
  return rows.map(toOpsBadgeAwardDto);
}

export async function createBadgeAward(
  ctx: OpsAuthedContext,
  donorId: string,
  input: CreateBadgeAwardInput
): Promise<OpsBadgeAwardDto> {
  const donor = await assertDonorInCallerOrgs(ctx, donorId);

  const badge = await badgesRepo.findBadgeByIdInOrgs(input.badge_id, [
    donor.organization_id,
  ]);
  if (!badge) {
    throw new NotFoundError("Badge not found for this donor's org");
  }
  if (!badge.is_active) {
    throw new BadRequestError("Badge is not active");
  }

  // App-level dedupe — one award per (badge, donor). CSV shows no
  // unique constraint; enforce the business-safe default explicitly.
  const existing = await badgesRepo.findAwardForBadgeAndDonor(badge.id, donor.id);
  if (existing) {
    throw new ConflictError("Donor already holds this badge");
  }

  const row = await badgesRepo.createAward({
    organization_id: donor.organization_id,
    badge_id: badge.id,
    donor_id: donor.id,
    award_reason: input.award_reason ?? null,
    award_source_entity_type: input.award_source_entity_type ?? null,
    award_source_entity_id: input.award_source_entity_id ?? null,
    awarded_at: input.awarded_at ?? new Date().toISOString(),
    awarded_by: ctx.user.id,
  });

  return toOpsBadgeAwardDto(row);
}
