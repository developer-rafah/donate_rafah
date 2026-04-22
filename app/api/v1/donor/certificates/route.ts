/**
 * GET /api/v1/donor/certificates
 *
 * Lists issued certificates for the donor, newest first.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { listDonorCertificates } from "@services/donor/recognition.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorCertificates(ctx);
  return ok(data);
});
