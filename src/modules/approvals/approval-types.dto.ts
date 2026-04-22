/**
 * Approval types — read-only DTO.
 *
 * This phase does not expose any CRUD for approval types; they are
 * referenced by id on create. The DTO exists for internal use and
 * potential future read endpoints.
 *
 * Aligned to `public.approval_types`.
 */

export interface ApprovalTypeScopeRow {
  id: string;
  organization_id: string;
  entity_type: string;
  is_active: boolean;
}
