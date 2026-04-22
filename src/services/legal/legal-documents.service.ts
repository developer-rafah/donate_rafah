import "server-only";

import type { OpsAuthedContext } from "@lib/auth";
import { NotFoundError } from "@lib/errors";
import * as repo from "@repositories/legal_documents/legal-documents.repository";
import {
  toLegalDocumentDto,
  type LegalDocumentDto,
} from "@modules/legal/legal-documents.dto";

export async function listLegalDocuments(
  ctx: OpsAuthedContext
): Promise<LegalDocumentDto[]> {
  const rows = await repo.listInOrgs(ctx.organizationIds);
  return rows.map(toLegalDocumentDto);
}

export async function getLegalDocument(
  ctx: OpsAuthedContext,
  id: string
): Promise<LegalDocumentDto> {
  const row = await repo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Legal document not found");
  return toLegalDocumentDto(row);
}
