import "server-only";

/**
 * Couriers repository.
 *
 * Real schema:
 *   - id               uuid  PK
 *   - organization_id  uuid  NOT NULL  FK -> organizations.id
 *   - user_id          uuid  NOT NULL  FK -> users.id
 *   - branch_id        uuid  NULL      FK -> branches.id
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { CourierContext } from "@lib/auth/types";

const COURIERS_TABLE = "couriers";

export async function findCourierByUserId(userId: string): Promise<CourierContext | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(COURIERS_TABLE)
    .select("id, user_id, organization_id, branch_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load courier by user id", error);
  }
  if (!data) return null;

  const row = data as {
    id: string;
    user_id: string;
    organization_id: string;
    branch_id: string | null;
  };
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
  };
}

/**
 * Richer read of `public.couriers` used by the courier profile endpoint.
 * Returns the display-relevant subset; status + code live on the courier
 * row itself (not a separate table in this schema).
 */
export interface CourierProfileRow {
  id: string;
  organization_id: string;
  user_id: string;
  branch_id: string | null;
  courier_code: string;
  status: string;
  vehicle_type_ref_id: string | null;
  max_daily_tasks: number;
  is_active_for_assignment: boolean;
  employment_type_ref_id: string | null;
  notes: string | null;
}

export async function findCourierProfileByUserId(
  userId: string
): Promise<CourierProfileRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(COURIERS_TABLE)
    .select(
      "id, organization_id, user_id, branch_id, courier_code, status, " +
        "vehicle_type_ref_id, max_daily_tasks, is_active_for_assignment, " +
        "employment_type_ref_id, notes"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load courier profile by user id", error);
  }
  return (data as unknown as CourierProfileRow) ?? null;
}
