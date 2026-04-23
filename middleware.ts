import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Next.js middleware.
 *
 * Purpose: keep Supabase auth cookies fresh on every request so server-side
 * code paths (Route Handlers, Server Components) always see a current
 * session. This is the canonical @supabase/ssr pattern.
 *
 * We intentionally do NOT enforce auth here — route-level guards
 * (`withAuth` / `requireUser`) are the source of truth for protected
 * resources. Middleware only refreshes cookies.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env is not configured yet, pass-through without touching cookies.
  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          req.cookies.set(name, value);
        });

        res = NextResponse.next({ request: req });

        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // Touch the user to trigger a refresh when appropriate.
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *   - _next/static
     *   - _next/image
     *   - favicon.ico
     *   - public asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
