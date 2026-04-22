/**
 * Validates and exposes Supabase-related environment variables.
 *
 * Keep this the only place env access happens for Supabase. Importing modules
 * get typed, validated strings and fail fast on boot if something is missing.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `[rafd/env] Missing required environment variable: ${name}. ` +
        `Check your .env.local or deployment environment.`
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Service-role key. SERVER ONLY. Never import from a client component.
 * We do not eagerly validate this at module load because browser bundles
 * must not crash if they happen to import the wrong file — instead the
 * service-role client itself validates on first use (see `service-role.ts`).
 */
export const SUPABASE_SERVICE_ROLE_KEY: string | undefined =
  process.env.SUPABASE_SERVICE_ROLE_KEY;
