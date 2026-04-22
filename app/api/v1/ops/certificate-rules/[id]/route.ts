/**
 * GET /api/v1/ops/certificate-rules/[id]
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { getCertificateRule } from "@services/recognition/certificates.service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await getCertificateRule(ctx, id);
  return ok(data);
});
