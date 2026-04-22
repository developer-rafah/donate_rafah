/**
 * GET /api/v1/ops/template-versions/[versionId]
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { getTemplateVersion } from "@services/comms/template-versions.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ versionId: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { versionId } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getTemplateVersion(ctx, versionId);
  return ok(data);
});
