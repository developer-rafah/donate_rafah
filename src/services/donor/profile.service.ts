import "server-only";

/**
 * Donor profile service.
 *
 * Assembles the donor profile view from the authenticated context, the
 * `public.profiles` row, and the caller's `users.primary_phone` /
 * `users.primary_email`. Phone/email are sourced from `users` because
 * `profiles` does not carry those columns in the real schema.
 *
 * No writes — profile mutation goes through the separate "profile update
 * request" flow, which is governed by approvals.
 */

import type { DonorAuthedContext } from "@lib/auth";
import { findProfileByUserId } from "@repositories/profiles/profiles.repository";
import { findContactChannelsById } from "@repositories/users/users.repository";
import type { DonorProfileDto } from "@modules/donor/profile.dto";

export async function getDonorProfile(ctx: DonorAuthedContext): Promise<DonorProfileDto> {
  const [profileRow, channels] = await Promise.all([
    findProfileByUserId(ctx.user.id),
    findContactChannelsById(ctx.user.id),
  ]);

  return {
    donor: {
      id: ctx.donor.id,
      userId: ctx.donor.userId,
    },
    user: {
      id: ctx.user.id,
      authUserId: ctx.user.authUserId,
      primaryPhone: channels?.primaryPhone ?? null,
      primaryEmail: channels?.primaryEmail ?? null,
    },
    profile: profileRow
      ? {
          fullName: profileRow.full_name,
          displayName: profileRow.display_name,
          avatarFilePath: profileRow.avatar_file_path,
          preferredLanguage: profileRow.preferred_language,
        }
      : null,
  };
}
