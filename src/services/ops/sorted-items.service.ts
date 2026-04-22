import "server-only";

/**
 * Sorted items service.
 *
 * Every operation goes through the session-ownership gate so the
 * "item belongs to a session that belongs to my org" invariant is checked
 * in exactly one place. PATCH takes an itemId and uses the caller's
 * session id set to scope — the set comes from the sessions the caller
 * can see.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/sorted_items/sorted-items.repository";
import * as sessionsRepo from "@repositories/sorting_sessions/sorting-sessions.repository";
import { assertSessionInCallerOrgs } from "./sorting-sessions.service";
import {
  toSortedItemDto,
  type CreateSortedItemInput,
  type SortedItemDto,
  type UpdateSortedItemInput,
} from "@modules/ops/sorted-items.dto";

/**
 * Build the set of session ids the caller can see. Used as a scoping
 * filter for cross-session lookups like PATCH /sorted-items/[itemId].
 */
async function callerSessionIds(ctx: OpsAuthedContext): Promise<string[]> {
  const rows = await sessionsRepo.listInOrgs(ctx.organizationIds);
  return rows.map((r) => r.id);
}

export async function listSortedItems(
  ctx: OpsAuthedContext,
  sessionId: string
): Promise<SortedItemDto[]> {
  await assertSessionInCallerOrgs(ctx, sessionId);
  const rows = await repo.listBySessionId(sessionId);
  return rows.map(toSortedItemDto);
}

export async function createSortedItem(
  ctx: OpsAuthedContext,
  sessionId: string,
  input: CreateSortedItemInput
): Promise<SortedItemDto> {
  await assertSessionInCallerOrgs(ctx, sessionId);

  const row = await repo.create({
    sorting_session_id: sessionId,
    item_classification_id: input.item_classification_id ?? null,
    donation_type_ref_id: input.donation_type_ref_id ?? null,
    donation_category_ref_id: input.donation_category_ref_id ?? null,
    item_name: input.item_name,
    item_description: input.item_description ?? null,
    quantity: input.quantity,
    quantity_unit_ref_id: input.quantity_unit_ref_id ?? null,
    condition_assessment_id: input.condition_assessment_id ?? null,
    estimated_value_amount: input.estimated_value_amount ?? null,
    estimated_value_currency: input.estimated_value_currency ?? null,
    sorting_decision_id: input.sorting_decision_id ?? null,
    // NOT NULL in schema. Default to false on creation; the approvals
    // workflow belongs to a later phase.
    is_approved: input.is_approved ?? false,
    notes: input.notes ?? null,
    created_by: ctx.user.id,
  });

  return toSortedItemDto(row);
}

export async function getSortedItem(
  ctx: OpsAuthedContext,
  itemId: string
): Promise<SortedItemDto> {
  const sessionIds = await callerSessionIds(ctx);
  const row = await repo.findByIdInSessions(itemId, sessionIds);
  if (!row) throw new NotFoundError("Sorted item not found");
  return toSortedItemDto(row);
}

export async function updateSortedItem(
  ctx: OpsAuthedContext,
  itemId: string,
  input: UpdateSortedItemInput
): Promise<SortedItemDto> {
  const sessionIds = await callerSessionIds(ctx);
  const row = await repo.updateByIdInSessions(itemId, sessionIds, {
    item_classification_id: input.item_classification_id,
    donation_type_ref_id: input.donation_type_ref_id,
    donation_category_ref_id: input.donation_category_ref_id,
    item_name: input.item_name,
    item_description: input.item_description,
    quantity: input.quantity,
    quantity_unit_ref_id: input.quantity_unit_ref_id,
    condition_assessment_id: input.condition_assessment_id,
    estimated_value_amount: input.estimated_value_amount,
    estimated_value_currency: input.estimated_value_currency,
    sorting_decision_id: input.sorting_decision_id,
    is_approved: input.is_approved,
    notes: input.notes,
    updated_by: ctx.user.id,
  });
  return toSortedItemDto(row);
}
