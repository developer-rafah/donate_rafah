/**
 * GET /api/v1/donor/points
 *
 * Lists the donor's points ledger entries, newest first.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { listDonorPoints } from "@services/donor/recognition.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async (_req, ctx) => {
  const data = await listDonorPoints(ctx);
  return ok(data);
});
