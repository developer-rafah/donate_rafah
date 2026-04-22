import "server-only";

/**
 * Sorting review tasks service.
 *
 * Review tasks are the only Phase 6 resource whose top-level list route
 * is NOT a child of a sorting session. We therefore scope by the set of
 * session ids the caller can see, collected from their org set.
 *
 * Note: this phase does NOT implement workflow transitions. PATCH
 * accepts status/completed_at as free-form fields; transition rules
 * (what statuses may follow which) belong to a later phase.
 */

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/sorting_review_tasks/sorting-review-tasks.repository";
import * as sessionsRepo from "@repositories/sorting_sessions/sorting-sessions.repository";
import { assertSessionInCallerOrgs } from "./sorting-sessions.service";
import {
  toReviewTaskDto,
  type CreateReviewTaskInput,
  type ReviewTaskDto,
  type UpdateReviewTaskInput,
} from "@modules/ops/review-tasks.dto";

async function callerSessionIds(ctx: OpsAuthedContext): Promise<string[]> {
  const rows = await sessionsRepo.listInOrgs(ctx.organizationIds);
  return rows.map((r) => r.id);
}

export async function listReviewTasks(
  ctx: OpsAuthedContext
): Promise<ReviewTaskDto[]> {
  const sessionIds = await callerSessionIds(ctx);
  const rows = await repo.listInSessions(sessionIds);
  return rows.map(toReviewTaskDto);
}

export async function getReviewTask(
  ctx: OpsAuthedContext,
  id: string
): Promise<ReviewTaskDto> {
  const sessionIds = await callerSessionIds(ctx);
  const row = await repo.findByIdInSessions(id, sessionIds);
  if (!row) throw new NotFoundError("Review task not found");
  return toReviewTaskDto(row);
}

export async function createReviewTask(
  ctx: OpsAuthedContext,
  input: CreateReviewTaskInput
): Promise<ReviewTaskDto> {
  // Verify the target session belongs to one of the caller's orgs. This
  // throws NotFound for foreign sessions — same pattern as other Ops
  // resources.
  await assertSessionInCallerOrgs(ctx, input.sorting_session_id);

  const row = await repo.create({
    sorting_session_id: input.sorting_session_id,
    review_type: input.review_type,
    assigned_to_user_id: input.assigned_to_user_id ?? null,
    status: input.status,
    due_at: input.due_at ?? null,
    review_notes: input.review_notes ?? null,
  });
  return toReviewTaskDto(row);
}

export async function updateReviewTask(
  ctx: OpsAuthedContext,
  id: string,
  input: UpdateReviewTaskInput
): Promise<ReviewTaskDto> {
  const sessionIds = await callerSessionIds(ctx);
  const row = await repo.updateByIdInSessions(id, sessionIds, {
    review_type: input.review_type,
    assigned_to_user_id: input.assigned_to_user_id,
    status: input.status,
    due_at: input.due_at,
    review_notes: input.review_notes,
    completed_at: input.completed_at,
  });
  return toReviewTaskDto(row);
}
