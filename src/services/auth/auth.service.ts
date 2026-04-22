import "server-only";

/**
 * Auth service.
 *
 * Thin orchestration layer between route handlers and repositories. The
 * "me" use case composes the already-assembled current-user context from
 * the auth helper; keeping it here means future enrichment (e.g. adding
 * permissions, unread counts, feature flags) lands in one place.
 */

import { requireUser } from "@lib/auth";
import { toMeDto, type MeDto } from "@modules/auth/me.dto";

export async function getMe(): Promise<MeDto> {
  const ctx = await requireUser();
  return toMeDto(ctx);
}
