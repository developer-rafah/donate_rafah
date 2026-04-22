import "server-only";

/**
 * Sorting decision logs service.
 *
 * Append-only audit trail of sorting decisions. If a sorted_item_id is
 * supplied, the service verifies it actually belongs to the parent
 * session (not just any session in the caller's org set).
 */

import type { OpsAuthedContext } from "@lib/auth";
import { BadRequestError } from "@lib/errors";
import * as repo from "@repositories/sorting_decision_logs/sorting-decision-logs.repository";
import * as itemsRepo from "@repositories/sorted_items/sorted-items.repository";
import { assertSessionInCallerOrgs } from "./sorting-sessions.service";
import {
  toDecisionLogDto,
  type CreateDecisionLogInput,
  type DecisionLogDto,
} from "@modules/ops/decision-logs.dto";

export async function listDecisionLogsForSession(
  ctx: OpsAuthedContext,
  sessionId: string
): Promise<DecisionLogDto[]> {
  await assertSessionInCallerOrgs(ctx, sessionId);
  const rows = await repo.listBySessionId(sessionId);
  return rows.map(toDecisionLogDto);
}

export async function createDecisionLogForSession(
  ctx: OpsAuthedContext,
  sessionId: string,
  input: CreateDecisionLogInput
): Promise<DecisionLogDto> {
  await assertSessionInCallerOrgs(ctx, sessionId);

  // When a sorted_item_id is supplied, verify it actually belongs to
  // this session — rejects cross-session decision logs.
  if (input.sorted_item_id) {
    const item = await itemsRepo.findByIdInSessions(input.sorted_item_id, [sessionId]);
    if (!item) {
      throw new BadRequestError("Sorted item does not belong to this sorting session");
    }
  }

  const row = await repo.create({
    sorting_session_id: sessionId,
    sorted_item_id: input.sorted_item_id ?? null,
    decision_id: input.decision_id,
    decision_notes: input.decision_notes ?? null,
    decided_by: ctx.user.id,
    decided_at: input.decided_at ?? new Date().toISOString(),
  });

  return toDecisionLogDto(row);
}
