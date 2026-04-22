import "server-only";

/**
 * Estimated values service.
 *
 * Every operation verifies the parent sorted item belongs to a session
 * the caller can see. The `sorting_session_id` for new value rows is
 * taken from that parent item — never from the client body.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/estimated_values/estimated-values.repository";
import { getSortedItem } from "./sorted-items.service";
import {
  toEstimatedValueDto,
  type CreateEstimatedValueInput,
  type EstimatedValueDto,
} from "@modules/ops/estimated-values.dto";

export async function listEstimatedValuesForItem(
  ctx: OpsAuthedContext,
  itemId: string
): Promise<EstimatedValueDto[]> {
  // Ownership via `getSortedItem` — throws NotFound if foreign-org.
  const item = await getSortedItem(ctx, itemId);
  if (!item) throw new NotFoundError("Sorted item not found");
  const rows = await repo.listBySortedItemId(item.id);
  return rows.map(toEstimatedValueDto);
}

export async function createEstimatedValueForItem(
  ctx: OpsAuthedContext,
  itemId: string,
  input: CreateEstimatedValueInput
): Promise<EstimatedValueDto> {
  const item = await getSortedItem(ctx, itemId);

  const row = await repo.create({
    sorting_session_id: item.sortingSessionId,
    sorted_item_id: item.id,
    valuation_type: input.valuation_type,
    estimated_amount: input.estimated_amount,
    currency_code: input.currency_code,
    valuation_notes: input.valuation_notes ?? null,
    // `valued_by` is the acting user. `approved_by` / `approved_at` are
    // intentionally NOT written here — approvals belong to a later phase.
    valued_by: ctx.user.id,
    status: input.status,
  });

  return toEstimatedValueDto(row);
}
