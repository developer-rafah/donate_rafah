/**
 * Integration providers — read-only DTO.
 *
 * Aligned to `public.integration_providers`. Org-scoped via
 * `organization_id`. No write endpoint in this phase — providers are
 * typically seeded by platform administrators, not created at runtime.
 */

export interface IntegrationProviderDto {
  id: string;
  organizationId: string;
  providerType: string;
  providerCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  adapterCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationProviderRow {
  id: string;
  organization_id: string;
  provider_type: string;
  provider_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  adapter_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function toIntegrationProviderDto(
  row: IntegrationProviderRow
): IntegrationProviderDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    providerType: row.provider_type,
    providerCode: row.provider_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    adapterCode: row.adapter_code,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Scope lookup used by the webhook receiver to resolve a
 * `provider_code` path param to its parent org (no auth available on
 * that endpoint). Also used internally by the configurations service.
 */
export interface IntegrationProviderScopeRow {
  id: string;
  organization_id: string;
  provider_code: string;
  is_active: boolean;
}
