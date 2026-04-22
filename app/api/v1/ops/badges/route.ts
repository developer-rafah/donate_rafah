/**
 * GET /api/v1/ops/badges
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listBadges } from "@services/recognition/badges.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listBadges(ctx);
  return ok(data);
});
