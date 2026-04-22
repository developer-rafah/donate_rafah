/**
 * Domain — Legal.
 *
 * Pure helpers. Framework-free, no DB access.
 */

/**
 * Document status treated as "not acceptable" by the acceptance flow.
 *
 * ASSUMPTION: documents with `status = "published"` are acceptable.
 * CSV shows no visible check constraint on `legal_documents.status`;
 * using the exact literal matches the phase's safe-minimal default.
 *
 * The service accepts the document regardless of `status` and merely
 * records whether the document is currently within its effective
 * window. Rejecting acceptance on unpublished documents is stricter
 * than the schema requires; to keep the phase narrow we only enforce
 * the effective-window check.
 */
export const LEGAL_DOCUMENT_PUBLISHED_STATUS = "published";

/**
 * Predicate: is the document currently within its effective window?
 * A null `effective_from`/`effective_to` means "no bound on that side".
 */
export function isLegalDocumentCurrentlyEffective(doc: {
  effective_from: string | null;
  effective_to: string | null;
}): boolean {
  const nowMs = Date.now();
  if (doc.effective_from && new Date(doc.effective_from).getTime() > nowMs) {
    return false;
  }
  if (doc.effective_to && new Date(doc.effective_to).getTime() < nowMs) {
    return false;
  }
  return true;
}
