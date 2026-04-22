/**
 * GET /api/v1/courier/tasks
 *
 * Lists field tasks the courier currently owns via an active assignment.
 */

import { ok } from "@lib/http/response";
import { withCourierHandler } from "@lib/auth";
import { listCourierTasks } from "@services/courier/tasks.service";

export const dynamic = "force-dynamic";

export const GET = withCourierHandler(async (_req, ctx) => {
  const data = await listCourierTasks(ctx);
  return ok(data);
});
