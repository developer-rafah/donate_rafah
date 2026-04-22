/**
 * Integration configurations — DTO + create/update schemas.
 *
 * Aligned to `public.integration_configurations`. NOT NULL in DB:
 *   organization_id, provider_id, config_name, config_payload_json,
 *   priority_order, is_default, is_active, created_at, updated_at.
 *
 * `config_payload_json` holds provider-specific configuration
 * including any secrets. The schema does not separate secret fields
 * into their own column, so read DTOs apply a light redaction pass
 * for common secret-shaped keys (see `redactConfigPayload` in the
 * service). Write endpoints accept the full payload — redaction is
 * read-only.
 */

import { z } from "@lib/validation";

export interface IntegrationConfigurationDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  providerId: string;
  configName: string;
  /** Secrets are redacted in-place. See `redactConfigPayload`. */
  configPayloadJson: Record<string, unknown>;
  priorityOrder: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface IntegrationConfigurationRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  provider_id: string;
  config_name: string;
  config_payload_json: Record<string, unknown> | null;
  priority_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export function toIntegrationConfigurationDto(
  row: IntegrationConfigurationRow,
  redactedPayload: Record<string, unknown>
): IntegrationConfigurationDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    providerId: row.provider_id,
    configName: row.config_name,
    configPayloadJson: redactedPayload,
    priorityOrder: row.priority_order,
    isDefault: row.is_default,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

/**
 * POST body. `organization_id` is NEVER accepted — it's derived from
 * the referenced `provider_id` (via provider.organization_id). Writer
 * identity fields (`created_by`, `updated_by`) come from ctx.
 */
export const createIntegrationConfigurationSchema = z
  .object({
    provider_id: z.string().uuid(),
    branch_id: z.string().uuid().optional(),
    config_name: z.string().min(1).max(500),
    config_payload_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 256, {
        message: "config_payload_json has too many top-level keys (max 256)",
      }),
    priority_order: z.number().int().min(0).max(10_000).optional(),
    is_default: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export type CreateIntegrationConfigurationInput = z.infer<
  typeof createIntegrationConfigurationSchema
>;

/**
 * PATCH body. All fields optional; only supplied fields are updated.
 * `provider_id` and `organization_id` are NOT patchable — the service
 * refuses the update if either appears.
 */
export const updateIntegrationConfigurationSchema = z
  .object({
    branch_id: z.string().uuid().nullable().optional(),
    config_name: z.string().min(1).max(500).optional(),
    config_payload_json: z
      .record(z.string(), z.unknown())
      .refine((obj) => Object.keys(obj).length <= 256, {
        message: "config_payload_json has too many top-level keys (max 256)",
      })
      .optional(),
    priority_order: z.number().int().min(0).max(10_000).optional(),
    is_default: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateIntegrationConfigurationInput = z.infer<
  typeof updateIntegrationConfigurationSchema
>;
