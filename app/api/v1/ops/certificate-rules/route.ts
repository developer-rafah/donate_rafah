/**
 * GET /api/v1/ops/certificate-rules
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listCertificateRules } from "@services/recognition/certificates.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listCertificateRules(ctx);
  return ok(data);
});
