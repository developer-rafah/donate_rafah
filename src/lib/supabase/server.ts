import "server-only";

/**
 * Server Supabase client — cookie-bound.
 *
 * Reads and refreshes the user's session via Next.js cookies. Use this in:
 *   - Route Handlers  (app/api/v1/.../route.ts)
 *   - Server Components
 *   - Server Actions
 *
 * This client respects Row Level Security and runs as the authenticated user.
 * For operations that must bypass RLS, use `service-role.ts` instead, and
 * only after careful authorization in the service layer.
 */

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `set` can throw when called from a Server Component render pass.
          // This is safe to ignore here because session refresh also happens
          // in middleware where cookie writes are allowed.
        }
      },
    },
  });
}
