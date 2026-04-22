/**
 * GET /api/v1/ops/legal-documents
 */

import { ok } from "@lib/http/response";
import { withOpsHandler } from "@lib/auth";
import { listLegalDocuments } from "@services/legal/legal-documents.service";

export const dynamic = "force-dynamic";

export const GET = withOpsHandler(async (_req, ctx) => {
  const data = await listLegalDocuments(ctx);
  return ok(data);
});
