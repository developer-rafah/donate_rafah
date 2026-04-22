import "server-only";

/**
 * Approval types repository.
 *
 * Phase 7 only needs `findScopeById` — used at create time to verify the
 * approval_type exists, belongs to one of the caller's orgs, matches the
 * declared `entity_type`, and is active.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ApprovalTypeScopeRow } from "@modules/approvals/approval-types.dto";

const TABLE = "approval_types";

export async function findScopeById(id: string): Promise<ApprovalTypeScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, entity_type, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load approval type scope", error);
  return (data as unknown as ApprovalTypeScopeRow) ?? null;
}
