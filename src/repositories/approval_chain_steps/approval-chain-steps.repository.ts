import "server-only";

/**
 * Approval chain steps repository.
 *
 * Reads steps for a chain in step_order. The domain layer picks the
 * currently-pending step given the chain's step list and the request's
 * decision history.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { ApprovalChainStepRow } from "@modules/approvals/approval-chains.dto";

const TABLE = "approval_chain_steps";

const SELECT_COLUMNS =
  "id, approval_chain_id, step_order, role_id, specific_user_id, " +
  "decision_mode, is_required, sla_hours, settings_json";

export async function listByChainId(chainId: string): Promise<ApprovalChainStepRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq("approval_chain_id", chainId)
    .order("step_order", { ascending: true });

  if (error) throw new DependencyError("Failed to list chain steps", error);
  return (data ?? []) as unknown as ApprovalChainStepRow[];
}
