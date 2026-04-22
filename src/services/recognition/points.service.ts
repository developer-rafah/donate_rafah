import "server-only";

/**
 * Points service — ledger reads + append-only awards.
 *
 * Awarding flow:
 *   1. Verify donor belongs to one of the caller's orgs.
 *   2. If a `rule_id` is supplied, verify it belongs to the same org,
 *      is active, is within its validity window, and that the donor
 *      has not exceeded the rule's `max_repeat_count`.
 *   3. Compute `balance_after = donor.total_points + points_delta`.
 *   4. Insert the append-only ledger row.
 *   5. Update `donors.total_points` to the new balance.
 *
 * Steps 4 and 5 are not wrapped in a transaction — PostgREST doesn't
 * expose one. The race window is narrow and recognition is
 * best-effort; a reconciliation pass in a later phase can true up the
 * counter from the ledger if needed.
 */

import type { OpsAuthedContext } from "@lib/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@lib/errors";
import * as ledgerRepo from "@repositories/points/points-ops.repository";
import * as rulesRepo from "@repositories/points_rules/points-rules.repository";
import * as donorsRepo from "@repositories/donors/donors.repository";
import { defaultLedgerTypeForDelta } from "@domain/recognition/rules";
import {
  toOpsPointsLedgerEntryDto,
  type CreatePointsAwardInput,
  type OpsPointsLedgerEntryDto,
} from "@modules/recognition/points.dto";

export async function listPointsLedger(
  ctx: OpsAuthedContext
): Promise<OpsPointsLedgerEntryDto[]> {
  const rows = await ledgerRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toOpsPointsLedgerEntryDto);
}

/**
 * Shared donor-org-scope check used by all donor-anchored recognition
 * endpoints. Returns the donor scope row on success; NotFound otherwise.
 */
async function assertDonorInCallerOrgs(ctx: OpsAuthedContext, donorId: string) {
  const donor = await donorsRepo.findScopeById(donorId);
  if (!donor || !ctx.organizationIds.includes(donor.organization_id)) {
    throw new NotFoundError("Donor not found");
  }
  return donor;
}

export async function listDonorPointsLedger(
  ctx: OpsAuthedContext,
  donorId: string
): Promise<OpsPointsLedgerEntryDto[]> {
  await assertDonorInCallerOrgs(ctx, donorId);
  const rows = await ledgerRepo.listByDonorId(donorId);
  return rows.map(toOpsPointsLedgerEntryDto);
}

export async function createPointsAward(
  ctx: OpsAuthedContext,
  donorId: string,
  input: CreatePointsAwardInput
): Promise<OpsPointsLedgerEntryDto> {
  const donor = await assertDonorInCallerOrgs(ctx, donorId);

  // Optional rule validation: rule must belong to the donor's org,
  // be active, be within its time window, and respect max_repeat_count.
  if (input.rule_id) {
    const rule = await rulesRepo.findByIdInOrgs(input.rule_id, [donor.organization_id]);
    if (!rule) throw new NotFoundError("Points rule not found for this donor's org");
    if (!rule.is_active) throw new BadRequestError("Points rule is not active");

    const nowMs = Date.now();
    if (rule.start_at && new Date(rule.start_at).getTime() > nowMs) {
      throw new BadRequestError("Points rule is not yet in effect");
    }
    if (rule.end_at && new Date(rule.end_at).getTime() < nowMs) {
      throw new BadRequestError("Points rule has expired");
    }

    if (rule.max_repeat_count !== null) {
      const prior = await ledgerRepo.countAwardsForDonorAndRule(donorId, rule.id);
      if (prior >= rule.max_repeat_count) {
        throw new ConflictError(
          "Points rule max_repeat_count reached for this donor"
        );
      }
    }
  }

  const balanceAfter = donor.total_points + input.points_delta;

  const ledgerRow = await ledgerRepo.create({
    organization_id: donor.organization_id,
    donor_id: donor.id,
    rule_id: input.rule_id ?? null,
    source_entity_type: input.source_entity_type ?? null,
    source_entity_id: input.source_entity_id ?? null,
    points_delta: input.points_delta,
    balance_after: balanceAfter,
    ledger_type: input.ledger_type ?? defaultLedgerTypeForDelta(input.points_delta),
    notes: input.notes ?? null,
    awarded_at: input.awarded_at ?? new Date().toISOString(),
    created_by: ctx.user.id,
  });

  // Update the maintained counter. Best-effort; ledger remains the
  // source of truth for award events.
  await donorsRepo.setTotalPoints(donor.id, balanceAfter);

  return toOpsPointsLedgerEntryDto(ledgerRow);
}
