import "server-only";

/**
 * Legal acceptances service — read + append-only create.
 *
 * Create flow (write-safety rules):
 *   1. Verify the referenced `legal_document_id` exists AND belongs to
 *      one of the caller's orgs. The acceptance's `organization_id` is
 *      derived from the document — never accepted from the body.
 *   2. Enforce the effective-window guard: if the document has
 *      `effective_from`/`effective_to` bounds and `now()` is outside,
 *      reject with `BAD_REQUEST`. Status is NOT enforced (no visible
 *      check constraint); effective window is the schema-grounded
 *      temporal control.
 *   3. Zod already enforced XOR of `user_id` / `donor_id`. The service
 *      applies the anti-spoof / scope rules:
 *        - `user_id` supplied → must equal `ctx.user.id`. Ops users
 *          may only record their own user-side acceptances. Recording
 *          an acceptance on behalf of another internal user is out of
 *          scope for this phase.
 *        - `donor_id` supplied → verify donor belongs to the same org
 *          as the document.
 *   4. Snapshot the document's `content_body` if no
 *      `acceptance_text_snapshot` was supplied (consent-law best
 *      practice: preserve exactly what was agreed to).
 *   5. Capture `ip_address` + `user_agent` from the request headers —
 *      NEVER from the body.
 *   6. Insert an append-only row. `accepted_at` defaults to now.
 */

import type { OpsAuthedContext } from "@lib/auth";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@lib/errors";

import * as acceptancesRepo from "@repositories/legal_acceptances/legal-acceptances.repository";
import * as documentsRepo from "@repositories/legal_documents/legal-documents.repository";
import * as donorsRepo from "@repositories/donors/donors.repository";

import { isLegalDocumentCurrentlyEffective } from "@domain/legal/rules";
import {
  toLegalAcceptanceDto,
  type CreateLegalAcceptanceInput,
  type LegalAcceptanceDto,
} from "@modules/legal/legal-acceptances.dto";

/**
 * Read subset of request headers that the acceptance record persists.
 * A tiny shape instead of passing the whole `Request` to keep the
 * service testable and decoupled from the Next.js runtime.
 */
export interface RequestAuditHeaders {
  ipAddress: string | null;
  userAgent: string | null;
}

export async function listLegalAcceptances(
  ctx: OpsAuthedContext
): Promise<LegalAcceptanceDto[]> {
  const rows = await acceptancesRepo.listInOrgs(ctx.organizationIds);
  return rows.map(toLegalAcceptanceDto);
}

export async function getLegalAcceptance(
  ctx: OpsAuthedContext,
  id: string
): Promise<LegalAcceptanceDto> {
  const row = await acceptancesRepo.findByIdInOrgs(id, ctx.organizationIds);
  if (!row) throw new NotFoundError("Legal acceptance not found");
  return toLegalAcceptanceDto(row);
}

export async function createLegalAcceptance(
  ctx: OpsAuthedContext,
  input: CreateLegalAcceptanceInput,
  headers: RequestAuditHeaders
): Promise<LegalAcceptanceDto> {
  // 1. Scope the document.
  const doc = await documentsRepo.findScopeById(input.legal_document_id);
  if (!doc || !ctx.organizationIds.includes(doc.organization_id)) {
    throw new NotFoundError("Legal document not found");
  }

  // 2. Effective-window guard.
  if (!isLegalDocumentCurrentlyEffective(doc)) {
    throw new BadRequestError(
      "Legal document is not currently within its effective window"
    );
  }

  // 3. Actor identity rules (Zod has already enforced XOR).
  if (input.user_id !== undefined) {
    if (input.user_id !== ctx.user.id) {
      throw new ForbiddenError(
        "user_id may only reference the currently authenticated user"
      );
    }
  } else if (input.donor_id !== undefined) {
    const donor = await donorsRepo.findScopeById(input.donor_id);
    if (!donor || donor.organization_id !== doc.organization_id) {
      throw new NotFoundError("Donor not found for this document's org");
    }
  }
  // else unreachable — Zod XOR guarantees at least one.

  // 4. Snapshot the document body if the client didn't supply one.
  const snapshot =
    input.acceptance_text_snapshot !== undefined
      ? input.acceptance_text_snapshot
      : doc.content_body;

  // 5. Write.
  const row = await acceptancesRepo.create({
    organization_id: doc.organization_id,
    legal_document_id: doc.id,
    user_id: input.user_id ?? null,
    donor_id: input.donor_id ?? null,
    accepted_at: input.accepted_at ?? new Date().toISOString(),
    source_channel: input.source_channel ?? null,
    ip_address: headers.ipAddress,
    user_agent: headers.userAgent,
    acceptance_text_snapshot: snapshot,
  });

  return toLegalAcceptanceDto(row);
}
