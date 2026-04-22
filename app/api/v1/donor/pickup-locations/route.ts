/**
 * GET   /api/v1/donor/pickup-locations  — list donor-owned
 * POST  /api/v1/donor/pickup-locations  — create for self
 * PATCH /api/v1/donor/pickup-locations  — update own row by id
 *
 * `donor_id` is never accepted from the client.
 * PATCH body requires `id` plus at least one writable field.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listDonorPickupLocations,
  createDonorPickupLocation,
  updateDonorPickupLocation,
} from "@services/donor/pickup-locations.service";
import {
  createPickupLocationSchema,
  updatePickupLocationSchema,
} from "@modules/donor/pickup-locations.dto";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorPickupLocations(ctx);
  return ok(data);
});

export const POST = withDonorHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createPickupLocationSchema);
  const data = await createDonorPickupLocation(ctx, input);
  return ok(data, { status: 201 });
});

export const PATCH = withDonorHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, updatePickupLocationSchema);
  const data = await updateDonorPickupLocation(ctx, input);
  return ok(data);
});
