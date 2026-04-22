import "server-only";

/**
 * Users repository.
 *
 * Real schema:
 *   public.users (
 *     id, auth_user_id, user_type, status,
 *     primary_phone, primary_email, last_login_at,
 *     is_phone_verified, is_email_verified,
 *     created_at, updated_at, created_by, updated_by
 *   )
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { AppUser } from "@lib/auth/types";

const USERS_TABLE = "users";

export async function findUserByAuthId(authUserId: string): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, auth_user_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load user by auth id", error);
  }
  if (!data) return null;

  const row = data as { id: string; auth_user_id: string };
  return { id: row.id, authUserId: row.auth_user_id };
}

export async function findUserById(id: string): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, auth_user_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load user by id", error);
  }
  if (!data) return null;

  const row = data as { id: string; auth_user_id: string };
  return { id: row.id, authUserId: row.auth_user_id };
}

/**
 * Read the caller's primary contact channels. Profiles does not carry
 * phone/email — they live on `public.users`.
 */
export async function findContactChannelsById(
  id: string
): Promise<{ primaryPhone: string | null; primaryEmail: string | null } | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("primary_phone, primary_email")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to read user contact channels", error);
  }
  if (!data) return null;

  const row = data as { primary_phone: string | null; primary_email: string | null };
  return { primaryPhone: row.primary_phone, primaryEmail: row.primary_email };
}
