/**
 * GET /api/v1/ops/certificate-templates
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listCertificateTemplates } from "@services/recognition/certificates.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listCertificateTemplates(ctx);
  return ok(data);
});
