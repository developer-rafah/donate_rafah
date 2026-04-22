import "server-only";

/**
 * Approval requests service.
 *
 * Owns the canonical visibility gate `assertRequestInCallerOrgs` used by
 * the decisions service. Mirrors the pattern in Phase 6
 * (`assertSessionInCallerOrgs`).
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError, NotFoundError } from "@lib/errors";
import * as requestsRepo from "@repositories/approval_requests/approval-requests.repository";
import * as typesRepo from "@repositories/approval_types/approval-types.repository";
import {
  APPROVAL_REQUEST_DEFAULT_STATUS,
} from "@domain/approvals/rules";
import {
  toApprovalRequestDto,
  type ApprovalRequestDto,
  type ApprovalRequestRow,
  type CreateApprovalRequestInput,
} from "@modules/approvals/approval-requests.dto";

export async function assertRequestInCallerOrgs(
  ctx: OpsAuthedContext,
  id: string
): Promise<ApprovalRequestRow> {
  const row = await requestsRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Approval request not found");
  return row;
}

export async function listApprovalRequests(
  ctx: OpsAuthedContext
): Promise<ApprovalRequestDto[]> {
  const rows = await requestsRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toApprovalRequestDto);
}

export async function getApprovalRequest(
  ctx: OpsAuthedContext,
  id: string
): Promise<ApprovalRequestDto> {
  const row = await assertRequestInCallerOrgs(ctx, id);
  return toApprovalRequestDto(row);
}

export async function createApprovalRequest(
  ctx: OpsAuthedContext,
  input: CreateApprovalRequestInput
): Promise<ApprovalRequestDto> {
  // Verify the approval_type exists AND belongs to one of the caller's
  // organizations. That also gives us the org_id for the new request.
  const type = await typesRepo.findScopeById(input.approval_type_id);
  if (!type || !ctx.organizationIds.includes(type.organization_id)) {
    throw new NotFoundError("Approval type not found");
  }
  if (!type.is_active) {
    throw new BadRequestError("Approval type is not active");
  }
  // Mutual consistency: the request's entity_type must match the type's
  // declared entity_type. Otherwise the chain lookup (which pivots on
  // entity_type) would silently find a mismatching or no chain.
  if (type.entity_type !== input.entity_type) {
    throw new BadRequestError(
      "entity_type does not match the approval type's declared entity_type"
    );
  }

  const row = await requestsRepo.create({
    organization_id: type.organization_id,
    branch_id: input.branch_id ?? null,
    approval_type_id: input.approval_type_id,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    request_status: APPROVAL_REQUEST_DEFAULT_STATUS,
    submitted_by: ctx.user.id,
    submitted_at: new Date().toISOString(),
    assigned_to_user_id: input.assigned_to_user_id ?? null,
    // NOT NULL in schema. Default to an empty object when omitted.
    payload_json: input.payload_json ?? {},
  });

  return toApprovalRequestDto(row);
}
