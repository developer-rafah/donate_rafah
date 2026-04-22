/**
 * GET /api/v1/courier/assignments
 *
 * Lists assignments belonging to the authenticated courier, newest first.
 */

import { ok } from "@lib/http/response";
import { withCourierHandler } from "@lib/auth";
import { listCourierAssignments } from "@services/courier/assignments.service";

export const dynamic = "force-dynamic";

export const GET = withCourierHandler(async (_req, ctx) => {
  const data = await listCourierAssignments(ctx);
  return ok(data);
});
