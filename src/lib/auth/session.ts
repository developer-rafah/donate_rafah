import "server-only";

/**
 * Session helper.
 *
 * Thin wrapper around Supabase auth for server-side code. Returns the
 * Supabase auth user (from `auth.users`) — this is NOT the application user
 * row (from `public.users`). Use `getCurrentUser` in `./current-user` to
 * resolve the application user.
 */

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@lib/supabase";
import { logger } from "@lib/logging";

/**
 * Return the authenticated Supabase auth user, or null when the request
 * carries no valid session.
 */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    // `getUser` reports an error for unauthenticated sessions too. Log at
    // debug level to avoid noise on public endpoints.
    logger.debug("auth.getUser returned error", { message: error.message });
    return null;
  }
  return data.user ?? null;
}
