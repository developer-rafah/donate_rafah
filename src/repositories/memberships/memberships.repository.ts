import "server-only";

/**
 * Memberships repository.
 *
 * Reads the membership + role graph for a given application user.
 *
 * ASSUMPTION: the schema is shaped like:
 *
 *   public.memberships
 *     - id              uuid pk
 *     - user_id         uuid FK -> public.users.id
 *     - organization_id uuid FK -> public.organizations.id
 *     - branch_id       uuid FK -> public.branches.id  (nullable)
 *
 *   public.membership_roles
 *     - membership_id   uuid FK -> public.memberships.id
 *     - role_id         uuid FK -> public.roles.id
 *
 *   public.roles
 *     - id   uuid pk
 *     - code text  (stable machine identifier; used by permission checks)
 *
 * We read memberships + nested roles in a single call using a PostgREST
 * embedded resource. If the actual FK names or join column names differ,
 * adjust the embedded selector below — everything else stays the same.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { MembershipContext, RoleContext } from "@lib/auth/types";

const MEMBERSHIPS_TABLE = "memberships";

// Shape returned by the PostgREST embedded select below.
interface RawMembershipRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  membership_roles: Array<{
    roles: { id: string; code: string } | null;
  }> | null;
}

export async function listMembershipsForUser(userId: string): Promise<MembershipContext[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(MEMBERSHIPS_TABLE)
    .select(
      `
        id,
        organization_id,
        branch_id,
        membership_roles (
          roles ( id, code )
        )
      `
    )
    .eq("user_id", userId);

  if (error) {
    throw new DependencyError("Failed to load memberships for user", error);
  }
  if (!data) return [];

  const rows = data as unknown as RawMembershipRow[];

  return rows.map<MembershipContext>((row) => {
    const roles: RoleContext[] = (row.membership_roles ?? [])
      .map((mr) => mr.roles)
      .filter((r): r is { id: string; code: string } => r !== null)
      .map((r) => ({ id: r.id, code: r.code }));

    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id ?? null,
      roles,
    };
  });
}
