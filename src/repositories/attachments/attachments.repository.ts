import "server-only";

/**
 * Attachments repository — minimal scope helper.
 *
 * Only the scope lookup used by ops flows that reference an existing
 * attachment (e.g. certificate issuance with a pre-linked PDF). File
 * upload, storage, and CRUD on attachments are not in this phase's
 * scope — the DB FK + RLS enforce visibility.
 */

import { createSupabaseServerClient } from "@lib/supabase";
import { DependencyError } from "@lib/errors";

const TABLE = "attachments";

export interface AttachmentScopeRow {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
}

export async function findScopeById(id: string): Promise<AttachmentScopeRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, organization_id, entity_type, entity_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DependencyError("Failed to load attachment scope", error);
  return (data as unknown as AttachmentScopeRow) ?? null;
}
