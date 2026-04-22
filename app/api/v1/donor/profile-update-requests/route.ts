/**
 * GET  /api/v1/donor/profile-update-requests  — list caller's own requests
 * POST /api/v1/donor/profile-update-requests  — create a request for self
 *
 * POST body:
 *   { "requested_changes": { ... }, "note"?: string }
 *
 * `donor_id` and `user_id` are derived from the authenticated context and
 * cannot be set by the client. Status is DB-defaulted and not accepted here.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDonorProfileUpdateRequests,
  createDonorProfileUpdateRequest,
} from "@services/donor/profile-update-requests.service";
import { createDonorProfileUpdateRequestSchema } from "@modules/donor/profile-update-requests.dto";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorProfileUpdateRequests(ctx);
  return ok(data);
});

export const POST = withDonorHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createDonorProfileUpdateRequestSchema);
  const data = await createDonorProfileUpdateRequest(ctx, input);
  return ok(data, { status: 201 });
});
