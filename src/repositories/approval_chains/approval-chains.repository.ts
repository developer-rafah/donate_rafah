import "server-only";

/**
 * Approval chains repository.
 *
 * Resolves the chain that should govern a given approval request. No
 * direct FK exists from `approval_requests` to `approval_chains`; the
 * relationship is implicit via `(organization_id, approval_type_id,
 * entity_type)` with `is_active = true`. A branch-specific chain is
 * preferred over an org-wide chain when both exist for the same type.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ApprovalChainScopeRow } from "@modules/approvals/approval-chains.dto";

const TABLE = "approval_chains";

const SELECT_COLUMNS =
  "id, organization_id, approval_type_id, entity_type, branch_id, is_default, is_active";

/**
 * Find the governing chain for a given request scope. Selection rules:
 *   1. organization_id + approval_type_id + entity_type + is_active=true
 *   2. prefer a chain whose branch_id matches the request's branch
 *      (when both are set) — falls back to org-wide chain (branch_id IS NULL)
 *   3. among remaining candidates, prefer is_default = true
 *
 * Returns null when no active chain exists — the service treats that as
 * a configuration error (DependencyError).
 */
export async function findGoverningChain(args: {
  organizationId: string;
  approvalTypeId: string;
  entityType: string;
  branchId: string | null;
}): Promise<ApprovalChainScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("organization_id", args.organizationId)
    .eq("approval_type_id", args.approvalTypeId)
    .eq("entity_type", args.entityType)
    .eq("is_active", true);

  if (error) throw new DependencyError("Failed to load approval chains", error);

  const rows = (data ?? []) as unknown as ApprovalChainScopeRow[];
  if (rows.length === 0) return null;

  // Prefer a branch-specific match, fall back to an org-wide chain.
  const scoped = args.branchId
    ? rows.filter((r) => r.branch_id === args.branchId)
    : [];
  const orgWide = rows.filter((r) => r.branch_id === null);

  const pool = scoped.length > 0 ? scoped : orgWide.length > 0 ? orgWide : rows;

  // Within the pool, prefer is_default = true if present.
  const def = pool.find((r) => r.is_default);
  return def ?? pool[0] ?? null;
}
