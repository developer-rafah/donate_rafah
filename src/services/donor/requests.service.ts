import "server-only";

/**
 * Donor donation requests service.
 *
 * Responsibilities:
 *   - list/read donor-owned requests
 *   - create a new request, supplying every NOT-NULL server-owned field
 *     that the DB does not auto-generate (see `generateRequestNumber`)
 *   - provide a single ownership guard (`assertRequestOwnedByDonor`) reused
 *     by child resources (details, bookings) so the rule lives in one place
 *
 * NOT in scope for Phase 4:
 *   - status transitions (submit / cancel / close)
 *   - richer routing (branch assignment, priority computation, etc.)
 */

import type { DonorAuthedContext } from "@lib/auth";
import { NotFoundError, DependencyError } from "@lib/errors";
import { logger } from "@lib/logging";
import {
  DONOR_REQUEST_INITIAL_STATUS_CODE,
  DONOR_REQUEST_SOURCE_CHANNEL,
} from "@domain/donor/rules";
import * as requestsRepo from "@repositories/donation_requests/donation-requests.repository";
import * as pickupRepo from "@repositories/pickup_locations/pickup-locations.repository";
import * as statusesRepo from "@repositories/request_statuses/request-statuses.repository";
import {
  toDonationRequestDto,
  type CreateDonationRequestInput,
  type DonationRequestDto,
} from "@modules/donor/requests.dto";

/**
 * Default priority_level for donor-initiated requests. NOT-NULL in schema.
 * ASSUMPTION: `"normal"` is a valid value in the DB taxonomy. If the schema
 * uses a different code, change this single constant. Priority promotion
 * (urgent/high) is the job of an internal routing service, not the donor API.
 */
const DONOR_DEFAULT_PRIORITY_LEVEL = "normal";

/**
 * Generate a request number suitable for the NOT-NULL UNIQUE
 * `donation_requests.request_number` column.
 *
 * The schema has no trigger or DB function that auto-generates this value
 * (confirmed from the trigger inspection reference), so the service layer
 * must provide one. We use a collision-resistant string of the form
 * `REQ-<yyyymmdd>-<timestamp>-<random>` to keep the value human-readable,
 * monotonic enough for debugging, and extremely unlikely to collide.
 *
 * This is deliberately a minimal, self-contained generator — not a
 * sequence-backed counter. A later phase may replace this with a DB sequence
 * or a dedicated numbering service; the UNIQUE constraint on request_number
 * makes the boundary safe to move without changing callers.
 */
function generateRequestNumber(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString().padStart(4, "0");
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = now.getUTCDate().toString().padStart(2, "0");
  const ts = now.getTime().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `REQ-${yyyy}${mm}${dd}-${ts}-${rand}`;
}

/**
 * Look up the donor's own request by id. Throws `NotFoundError` when the
 * request does not exist OR is owned by someone else.
 */
export async function assertRequestOwnedByDonor(
  ctx: DonorAuthedContext,
  requestId: string
): Promise<DonationRequestDto> {
  const row = await requestsRepo.findOwnedById(ctx.donor.id, requestId);
  if (!row) throw new NotFoundError("Donation request not found");
  return toDonationRequestDto(row);
}

export async function listDonorRequests(
  ctx: DonorAuthedContext
): Promise<DonationRequestDto[]> {
  const rows = await requestsRepo.listByDonorId(ctx.donor.id);
  return rows.map(toDonationRequestDto);
}

export async function getDonorRequest(
  ctx: DonorAuthedContext,
  requestId: string
): Promise<DonationRequestDto> {
  return assertRequestOwnedByDonor(ctx, requestId);
}

/**
 * Resolve the initial status id for newly-created donor requests, scoped
 * to the donor's organization. Prefers the conventional code; falls back
 * to the `is_initial` flag; returns null if neither exists (the column is
 * nullable, so the insert still succeeds — a later phase owns transitions).
 */
async function resolveInitialStatusId(organizationId: string): Promise<string | null> {
  const byCode = await statusesRepo.findByOrgAndCode(
    organizationId,
    DONOR_REQUEST_INITIAL_STATUS_CODE
  );
  if (byCode) return byCode.id;

  const flagged = await statusesRepo.findInitialForOrg(organizationId);
  if (flagged) return flagged.id;

  logger.warn("no initial request status found for organization", {
    organizationId,
    triedCode: DONOR_REQUEST_INITIAL_STATUS_CODE,
  });
  return null;
}

export async function createDonorRequest(
  ctx: DonorAuthedContext,
  input: CreateDonationRequestInput
): Promise<DonationRequestDto> {
  // pickup_location_id is required by both our schema AND the DB. Enforce
  // donor ownership of the pickup location up-front so a spoofed id maps
  // to NOT_FOUND rather than leaking or 500ing at the DB layer.
  const loc = await pickupRepo.findOwnedById(ctx.donor.id, input.pickup_location_id);
  if (!loc) {
    throw new NotFoundError("Pickup location not found for this donor");
  }

  const currentStatusId = await resolveInitialStatusId(ctx.donor.organizationId);

  const row = await requestsRepo.create({
    // organization and branch are taken from the donor's row — they are
    // NOT-NULL (organization) or optional (branch) in the schema and
    // always equal the donor's own scope for donor-initiated requests.
    organization_id: ctx.donor.organizationId,
    branch_id: ctx.donor.branchId,
    donor_id: ctx.donor.id,
    request_number: generateRequestNumber(),
    pickup_location_id: input.pickup_location_id,
    donation_type_ref_id: input.donation_type_ref_id ?? null,
    donation_category_ref_id: input.donation_category_ref_id ?? null,
    current_status_id: currentStatusId,
    priority_level: DONOR_DEFAULT_PRIORITY_LEVEL,
    summary_description: input.summary_description,
    estimated_quantity_text: input.estimated_quantity_text ?? null,
    donor_notes: input.donor_notes ?? null,
    source_channel: DONOR_REQUEST_SOURCE_CHANNEL,
    submitted_at: new Date().toISOString(),
    cancellation_reason_ref_id: null,
  });

  if (!row) {
    throw new DependencyError("Donation request was not created");
  }
  return toDonationRequestDto(row);
}
