/**
 * GET  /api/v1/ops/donors/[donorId]/issued-certificates
 * POST /api/v1/ops/donors/[donorId]/issued-certificates
 *
 * Issuance writes only DB metadata. No PDF rendering, no external
 * delivery. `certificate_number` + `verification_code` are generated
 * server-side; `issue_status` is `"issued"` when a `pdf_attachment_id`
 * is supplied, else `"pending"`.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireOps } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDonorCertificates,
  issueCertificate,
} from "@services/recognition/certificates.service";
import { createIssuedCertificateSchema } from "@modules/recognition/certificates.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ donorId: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { donorId } = await routeCtx.params;
  const ctx = await requireOps();
  const data = await listDonorCertificates(ctx, donorId);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { donorId } = await routeCtx.params;
  const ctx = await requireOps();
  const input = await parseJsonBody(req, createIssuedCertificateSchema);
  const data = await issueCertificate(ctx, donorId, input);
  return ok(data, { status: 201 });
});
