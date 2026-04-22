import "server-only";

/**
 * Sorting sessions service.
 *
 * Owns the canonical ops-scoping gate `assertSessionInCallerOrgs` used by
 * every child resource (items, decision-logs). A session is "visible" to
 * the caller iff its `organization_id` is in the caller's membership set;
 * foreign-org rows map to NotFound (never Forbidden) to avoid existence
 * leaks, matching the pattern used in donor/courier flows.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError, NotFoundError } from "@lib/errors";
import * as sessionsRepo from "@repositories/sorting_sessions/sorting-sessions.repository";
import * as requestsRepo from "@repositories/donation_requests/donation-requests.repository";
import * as intakeRepo from "@repositories/intake_records/intake-records.repository";
import {
  toSortingSessionDto,
  type CreateSortingSessionInput,
  type SortingSessionDto,
  type UpdateSortingSessionInput,
} from "@modules/ops/sorting-sessions.dto";

export async function assertSessionInCallerOrgs(
  ctx: OpsAuthedContext,
  sessionId: string
): Promise<SortingSessionDto> {
  const row = await sessionsRepo.findByIdInOrgs(sessionId, ctx.organizationIds);
  if (!row) throw new NotFoundError("Sorting session not found");
  return toSortingSessionDto(row);
}

export async function listSortingSessions(
  ctx: OpsAuthedContext
): Promise<SortingSessionDto[]> {
  const rows = await sessionsRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toSortingSessionDto);
}

export async function getSortingSession(
  ctx: OpsAuthedContext,
  id: string
): Promise<SortingSessionDto> {
  return assertSessionInCallerOrgs(ctx, id);
}

export async function createSortingSession(
  ctx: OpsAuthedContext,
  input: CreateSortingSessionInput
): Promise<SortingSessionDto> {
  // Verify the donation_request exists AND belongs to one of the caller's
  // organizations. That also gives us the org_id for the new session,
  // which the schema requires NOT NULL.
  const request = await requestsRepo.findScopeById(input.donation_request_id);
  if (!request || !ctx.organizationIds.includes(request.organization_id)) {
    throw new NotFoundError("Donation request not found");
  }

  // Verify the intake record references the same donation_request — the
  // pair (donation_request_id, intake_record_id) must be mutually
  // consistent. This rejects cross-stitching an intake from another
  // request into this session.
  const intake = await intakeRepo.findScopeById(input.intake_record_id);
  if (!intake || !ctx.organizationIds.includes(intake.organization_id)) {
    throw new NotFoundError("Intake record not found");
  }
  if (intake.donation_request_id !== input.donation_request_id) {
    throw new BadRequestError(
      "Intake record does not belong to the specified donation request"
    );
  }

  const row = await sessionsRepo.create({
    organization_id: request.organization_id,
    // Default branch to the intake's branch; the client may override
    // explicitly. Intake's branch is the more operationally-correct
    // default (physical location of the goods) than the request's.
    branch_id: input.branch_id ?? intake.branch_id,
    donation_request_id: input.donation_request_id,
    intake_record_id: input.intake_record_id,
    sorting_status: input.sorting_status,
  });
  return toSortingSessionDto(row);
}

export async function updateSortingSession(
  ctx: OpsAuthedContext,
  id: string,
  input: UpdateSortingSessionInput
): Promise<SortingSessionDto> {
  const row = await sessionsRepo.updateByIdInOrgs(id, ctx.organizationIds, {
    sorting_status: input.sorting_status,
    started_at: input.started_at,
    completed_at: input.completed_at,
    reviewed_at: input.reviewed_at,
    review_notes: input.review_notes,
    branch_id: input.branch_id,
  });
  return toSortingSessionDto(row);
}
