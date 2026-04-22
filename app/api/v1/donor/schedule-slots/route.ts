/**
 * GET /api/v1/donor/schedule-slots
 *
 * Read-only active-slot catalog for request creation UX.
 */

import { ok } from "@lib/http/response";
import { withDonorHandler } from "@lib/auth";
import { listActiveScheduleSlots } from "@services/donor/schedule-slots.service";

export const dynamic = "force-dynamic";

export const GET = withDonorHandler(async () => {
  const data = await listActiveScheduleSlots();
  return ok(data);
});
