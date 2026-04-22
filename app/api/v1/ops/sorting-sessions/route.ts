/**
 * GET  /api/v1/ops/sorting-sessions
 * POST /api/v1/ops/sorting-sessions
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listSortingSessions,
  createSortingSession,
} from "@services/ops/sorting-sessions.service";
import { createSortingSessionSchema } from "@modules/ops/sorting-sessions.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listSortingSessions(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createSortingSessionSchema);
  const data = await createSortingSession(ctx, input);
  return ok(data, { status: 201 });
});
