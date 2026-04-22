/**
 * Minimal request-header extractor for audit-related writes
 * (Phase 11 — legal acceptances). Kept framework-light so services
 * don't need to import Next.js request types directly.
 *
 * - `ipAddress` is derived from the first entry in `x-forwarded-for`
 *   (the leftmost address is the originating client when a trusted
 *   proxy chain is in play), falling back to `x-real-ip`. Both are
 *   optional and may be null in local/dev environments.
 *
 * - `userAgent` comes from the `user-agent` header verbatim (trimmed
 *   and length-capped to 1000 characters for safety — headers are
 *   attacker-controlled).
 */

const USER_AGENT_MAX_LENGTH = 1000;

export interface AuditRequestHeaders {
  ipAddress: string | null;
  userAgent: string | null;
}

export function readAuditHeaders(req: Request): AuditRequestHeaders {
  const xff = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ua = req.headers.get("user-agent");

  let ipAddress: string | null = null;
  if (xff) {
    // x-forwarded-for is a comma-separated list — take the leftmost.
    const first = xff.split(",")[0]?.trim();
    if (first) ipAddress = first;
  }
  if (!ipAddress && realIp) {
    ipAddress = realIp.trim();
  }

  const userAgent = ua ? ua.trim().slice(0, USER_AGENT_MAX_LENGTH) : null;

  return {
    ipAddress: ipAddress && ipAddress.length > 0 ? ipAddress : null,
    userAgent: userAgent && userAgent.length > 0 ? userAgent : null,
  };
}
