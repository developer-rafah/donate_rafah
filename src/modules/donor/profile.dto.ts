/**
 * Donor profile — wire DTOs.
 *
 * Aligned to the real SQL contract:
 *   public.profiles (
 *     id, user_id, first_name, father_name, grandfather_name, last_name,
 *     full_name, display_name, gender, date_of_birth, nationality_ref_id,
 *     preferred_language, avatar_file_path, notes,
 *     created_at, updated_at, created_by, updated_by
 *   )
 *   public.users carries `primary_phone` / `primary_email`.
 *
 * `profiles` has no `phone` column — donor-facing profile output sources
 * phone from `users.primary_phone` via a separate repository call.
 */

export interface DonorProfileDto {
  donor: {
    id: string;
    userId: string;
  };
  user: {
    id: string;
    authUserId: string;
    primaryPhone: string | null;
    primaryEmail: string | null;
  };
  profile: {
    fullName: string | null;
    displayName: string | null;
    avatarFilePath: string | null;
    preferredLanguage: string;
  } | null;
}

export interface DonorProfileRow {
  full_name: string | null;
  display_name: string | null;
  avatar_file_path: string | null;
  preferred_language: string;
}
