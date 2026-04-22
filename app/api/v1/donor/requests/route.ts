/**
 * GET  /api/v1/donor/requests  — list donor's own requests
 * POST /api/v1/donor/requests  — create request for self
 *
 * Server-owned fields (donor_id, current_status_id, request_number,
 * timestamps, audit fields) are NEVER accepted from the body — the request
 * schema is `.strict()` and the service derives them.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDonorRequests,
  createDonorRequest,
} from "@services/donor/requests.service";
import { createDonationRequestSchema } from "@modules/donor/requests.dto";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorRequests(ctx);
  return ok(data);
});

export const POST = withDonorHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createDonationRequestSchema);
  const data = await createDonorRequest(ctx, input);
  return ok(data, { status: 201 });
});
