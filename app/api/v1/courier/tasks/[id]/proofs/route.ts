/**
 * GET  /api/v1/courier/tasks/[id]/proofs  — list field proofs
 * POST /api/v1/courier/tasks/[id]/proofs  — create a field proof (metadata)
 *
 * Metadata-only. The caller must first upload the file through the
 * attachments flow and pass the resulting `attachment_id` here. The FK +
 * RLS on `public.attachments` enforce that the caller can actually see
 * the attachment they are referencing.
 */

import { ok, withErrorHandling } from "@lib/http/response";
import { requireCourier } from "@lib/auth";
import { parseJsonBody } from "@lib/validation";
import {
  listFieldProofsForTask,
  createFieldProofForTask,
} from "@services/courier/field-proofs.service";
import { createFieldProofSchema } from "@modules/courier/field-proofs.dto";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const data = await listFieldProofsForTask(ctx, id);
  return ok(data);
});

export const POST = withErrorHandling(async (req: Request, routeCtx: RouteContext) => {
  const { id } = await routeCtx.params;
  const ctx = await requireCourier();
  const input = await parseJsonBody(req, createFieldProofSchema);
  const data = await createFieldProofForTask(ctx, id, input);
  return ok(data, { status: 201 });
});
