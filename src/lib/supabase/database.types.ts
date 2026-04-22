/**
 * Supabase database types.
 *
 * This file is a PLACEHOLDER. Replace its contents with the output of:
 *
 *   npx supabase gen types typescript \
 *     --project-id <your-project-ref> \
 *     --schema public \
 *     > src/lib/supabase/database.types.ts
 *
 * We intentionally do not hand-author column shapes here because the schema
 * is owned externally and must not be redesigned from this repository.
 * See docs/database.md for the workflow.
 */

export type Database = {
  public: {
    // Replace with generated types. Using a permissive shape keeps the
    // scaffold compiling until real types are generated.
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
};
