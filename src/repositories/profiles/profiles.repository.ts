import "server-only";

/**
 * Profiles repository.
 *
 * Reads against `public.profiles`, keyed by `user_id` (UNIQUE).
 * Real schema surface used by the donor API: `full_name`, `display_name`,
 * `avatar_file_path`, `preferred_language`. Other fields (first/middle/last
 * names, date_of_birth, gender, nationality_ref_id, notes) exist but are
 * not exposed by the donor endpoint yet.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";
import type { DonorProfileRow } from "@modules/donor/profile.dto";

const PROFILES_TABLE = "profiles";

export async function findProfileByUserId(
  userId: string
): Promise<DonorProfileRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select("full_name, display_name, avatar_file_path, preferred_language")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new DependencyError("Failed to load profile by user id", error);
  }
  if (!data) return null;

  const row = data as {
    full_name: string | null;
    display_name: string | null;
    avatar_file_path: string | null;
    preferred_language: string;
  };
  return {
    full_name: row.full_name,
    display_name: row.display_name,
    avatar_file_path: row.avatar_file_path,
    preferred_language: row.preferred_language,
  };
}
