/**
 * GET   /api/v1/donor/contact-details  — list donor-owned contact details
 * PATCH /api/v1/donor/contact-details  — update a single donor-owned row
 *
 * PATCH body shape:
 *   { "id": "uuid", "contact_value"?: string, "is_primary"?: boolean }
 *
 * Unknown keys are rejected by Zod (`.strict()`). Ownership is enforced in
 * the repository via `WHERE id = :id AND donor_id = :donorId`.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDonorContactDetails,
  updateDonorContactDetail,
} from "@services/donor/contact-details.service";
import { updateDonorContactDetailSchema } from "@modules/donor/contact-details.dto";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorContactDetails(ctx);
  return ok(data);
});

export const PATCH = withDonorHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, updateDonorContactDetailSchema);
  const data = await updateDonorContactDetail(ctx, input);
  return ok(data);
});
