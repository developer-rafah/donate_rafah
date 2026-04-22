import "server-only";

/**
 * Service-role Supabase client — SERVER ONLY, elevated privileges.
 *
 * Bypasses Row Level Security. Use sparingly, only after explicit
 * authorization checks have been performed in the service layer.
 *
 * NEVER import this from:
 *   - a client component
 *   - a file that is transitively imported by a client component
 *   - any module reachable from the browser bundle
 *
 * The `server-only` import above will cause a build-time error if this
 * module is pulled into a client bundle.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

let cached: SupabaseClient<Database> | null = null;

export function createSupabaseServiceRoleClient(): SupabaseClient<Database> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[rafd/supabase] SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "The service-role client cannot be used. Configure it in your server environment."
    );
  }

  if (cached) return cached;

  cached = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      // No session persistence — this client is used for server-to-server work only.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
