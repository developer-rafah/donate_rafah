"use client";

/**
 * Browser Supabase client.
 *
 * Uses the public anon key and is safe to use in client components. Sessions
 * are persisted in the browser and synced with the server via middleware /
 * server client cookies.
 *
 * Import from client components only.
 */

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
