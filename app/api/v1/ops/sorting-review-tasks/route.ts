/**
 * GET  /api/v1/ops/sorting-review-tasks
 * POST /api/v1/ops/sorting-review-tasks
 *
 * Review tasks list is NOT a child route of a session — it's scoped by
 * the union of sessions the caller can see via their org memberships.
 * POST requires `sorting_session_id` in the body; the service verifies
 * that session belongs to one of the caller's orgs.
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listReviewTasks,
  createReviewTask,
} from "@services/ops/review-tasks.service";
import { createReviewTaskSchema } from "@modules/ops/review-tasks.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listReviewTasks(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createReviewTaskSchema);
  const data = await createReviewTask(ctx, input);
  return ok(data, { status: 201 });
});
