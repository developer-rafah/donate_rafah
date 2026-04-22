/**
 * Domain — Recognition (points + badges + certificates).
 *
 * Pure helpers and constants. Framework-free, no DB access.
 */

/**
 * Default `points_ledger.ledger_type` derived from the sign of the delta.
 *
 * ASSUMPTION: `"credit"` and `"debit"` are the canonical ledger types.
 * CSV has no visible check constraint. Single adjustment point.
 */
export const LEDGER_TYPE_CREDIT = "credit";
export const LEDGER_TYPE_DEBIT = "debit";

export function defaultLedgerTypeForDelta(delta: number): string {
  return delta >= 0 ? LEDGER_TYPE_CREDIT : LEDGER_TYPE_DEBIT;
}

/**
 * Default `issued_certificates.issue_status`.
 * ASSUMPTION: `"issued"` when a PDF attachment is already linked;
 * `"pending"` otherwise. CSV has no visible check constraint.
 */
export const CERTIFICATE_STATUS_ISSUED = "issued";
export const CERTIFICATE_STATUS_PENDING = "pending";

export function defaultIssueStatus(hasPdfAttachment: boolean): string {
  return hasPdfAttachment ? CERTIFICATE_STATUS_ISSUED : CERTIFICATE_STATUS_PENDING;
}

/**
 * Generate a certificate number for the NOT-NULL
 * `issued_certificates.certificate_number` column.
 *
 * Format: `CERT-<yyyymmdd>-<timestamp-base36>-<6-random>`. Same
 * collision-resistance approach as the donation request_number
 * generator in Phase 4. No visible DB uniqueness constraint — the
 * random suffix makes collisions extremely unlikely.
 */
export function generateCertificateNumber(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear().toString().padStart(4, "0");
  const mm = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = now.getUTCDate().toString().padStart(2, "0");
  const ts = now.getTime().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `CERT-${yyyy}${mm}${dd}-${ts}-${rand}`;
}

/**
 * Generate a short verification code for the nullable
 * `issued_certificates.verification_code` column. Intended for
 * third-party verification (e.g. embedding on printed certificates).
 * Length-10 base36 keeps it human-typable.
 */
export function generateVerificationCode(): string {
  const a = Math.random().toString(36).slice(2, 8);
  const b = Math.random().toString(36).slice(2, 6);
  return (a + b).toUpperCase();
}
