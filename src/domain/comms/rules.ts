/**
 * Domain — Communications (templates + notifications + campaigns).
 *
 * Only status-default constants live here. No complex predicates in
 * this phase — phase 9 is read-heavy; the little write-side logic that
 * exists (org resolution, parent-scope checks) lives in services.
 *
 * ASSUMPTIONS (all flagged):
 *   - `notifications.status` default on create = `"draft"`. CSV has
 *     no visible check constraint.
 *   - `notification_recipients.delivery_status` default on create =
 *     `"pending"`. Same rationale.
 *   - `communication_campaigns.campaign_status` default on create =
 *     `"draft"`. Same rationale.
 */

export const OPS_NOTIFICATION_DEFAULT_STATUS = "draft";
export const OPS_NOTIFICATION_RECIPIENT_DEFAULT_DELIVERY_STATUS = "pending";
export const OPS_CAMPAIGN_DEFAULT_STATUS = "draft";

/**
 * Given the caller's organization set and the possibly-empty org hints
 * (explicit body `organization_id` + derived-from-template org id),
 * return the single organization this write should target, or null
 * when the situation is ambiguous.
 *
 * Rules:
 *   - If an explicit org is supplied, it MUST be one of the caller's
 *     orgs; otherwise the caller throws NotFound.
 *   - If a derived org is supplied, it MUST match the explicit org
 *     when both are given (otherwise caller throws BadRequest).
 *   - If neither is supplied, fall back to the caller's sole
 *     organization; if the caller has ≥2 orgs, return null (ambiguous).
 *
 * Returns the chosen organization id, or null when ambiguous.
 */
export function resolveTargetOrgId(args: {
  explicit: string | null;
  derived: string | null;
  callerOrgs: string[];
}): string | null {
  const { explicit, derived, callerOrgs } = args;

  if (explicit && derived && explicit !== derived) return null;

  const chosen = explicit ?? derived ?? null;
  if (chosen) {
    return callerOrgs.includes(chosen) ? chosen : null;
  }
  if (callerOrgs.length === 1) return callerOrgs[0] ?? null;
  return null;
}
