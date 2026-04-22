/**
 * GET  /api/v1/ops/legal-acceptances
 * POST /api/v1/ops/legal-acceptances
 *
 * Creates an append-only legal_acceptances row. The service derives
 * `organization_id` from the referenced document (never accepted from
 * the body). `ip_address` and `user_agent` are read from request
 * headers server-side.
 *
 * Actor rules:
 *   - Exactly one of `user_id` / `donor_id` required (Zod XOR).
 *   - `user_id`, if supplied, must equal `ctx.user.id` (no spoofing of
 *     other internal users).
 *   - `donor_id`, if supplied, must belong to the document's org.
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import { readAuditHeaders } from "@lib/http/audit-headers";
import {
  listLegalAcceptances,
  createLegalAcceptance,
} from "@services/legal/legal-acceptances.service";
import { createLegalAcceptanceSchema } from "@modules/legal/legal-acceptances.dto";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listLegalAcceptances(ctx);
  return ok(data);
});

export const POST = withOpsHandler(async (req, ctx) => {
  const input = await parseJsonBody(req, createLegalAcceptanceSchema);
  const headers = readAuditHeaders(req);
  const data = await createLegalAcceptance(ctx, input, headers);
  return ok(data, { status: 201 });
});
