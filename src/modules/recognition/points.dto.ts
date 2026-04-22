/**
 * Points — rules, ledger, and award input.
 *
 * Aligned to `public.points_rules` and `public.points_ledger`.
 *
 * NOT NULL on ledger: organization_id, donor_id, points_delta,
 * balance_after, ledger_type, awarded_at.
 *
 * `rule_id` is optional on the ledger — manual awards are permitted.
 */

import { z } from "@lib/validation";

// ---- Rules ------------------------------------------------------------------

export interface PointsRuleDto {
  id: string;
  organizationId: string;
  ruleCode: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  triggerEventCode: string;
  pointsValue: number;
  calculationMode: string;
  conditionPayloadJson: Record<string, unknown>;
  maxRepeatCount: number | null;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PointsRuleRow {
  id: string;
  organization_id: string;
  rule_code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  trigger_event_code: string;
  points_value: number;
  calculation_mode: string;
  condition_payload_json: Record<string, unknown> | null;
  max_repeat_count: number | null;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toPointsRuleDto(row: PointsRuleRow): PointsRuleDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ruleCode: row.rule_code,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    description: row.description,
    triggerEventCode: row.trigger_event_code,
    pointsValue: row.points_value,
    calculationMode: row.calculation_mode,
    conditionPayloadJson: row.condition_payload_json ?? {},
    maxRepeatCount: row.max_repeat_count,
    isActive: row.is_active,
    startAt: row.start_at,
    endAt: row.end_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- Ledger -----------------------------------------------------------------

export interface OpsPointsLedgerEntryDto {
  id: string;
  organizationId: string;
  donorId: string;
  ruleId: string | null;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  pointsDelta: number;
  balanceAfter: number;
  ledgerType: string;
  notes: string | null;
  awardedAt: string;
  createdAt: string;
  createdBy: string | null;
}

export interface OpsPointsLedgerRow {
  id: string;
  organization_id: string;
  donor_id: string;
  rule_id: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  points_delta: number;
  balance_after: number;
  ledger_type: string;
  notes: string | null;
  awarded_at: string;
  created_at: string;
  created_by: string | null;
}

export function toOpsPointsLedgerEntryDto(
  row: OpsPointsLedgerRow
): OpsPointsLedgerEntryDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    donorId: row.donor_id,
    ruleId: row.rule_id,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    pointsDelta: row.points_delta,
    balanceAfter: row.balance_after,
    ledgerType: row.ledger_type,
    notes: row.notes,
    awardedAt: row.awarded_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

// ---- Award input ------------------------------------------------------------

/**
 * POST body for awarding points. `balance_after`, `created_by`,
 * `organization_id` are all server-derived. `ledger_type` is
 * server-derived from the sign of `points_delta` when omitted.
 *
 * `rule_id` is optional — manual ops awards are schema-permitted
 * (the FK column is nullable). When supplied, the service verifies
 * the rule belongs to the donor's org and is currently active.
 */
export const createPointsAwardSchema = z
  .object({
    points_delta: z.number().int(),
    rule_id: z.string().uuid().optional(),
    source_entity_type: z.string().min(1).max(100).optional(),
    source_entity_id: z.string().uuid().optional(),
    notes: z.string().max(4000).optional(),
    ledger_type: z.string().min(1).max(100).optional(),
    awarded_at: z.string().datetime().optional(),
  })
  .strict()
  .refine((body) => body.points_delta !== 0, {
    message: "points_delta must be non-zero",
  });

export type CreatePointsAwardInput = z.infer<typeof createPointsAwardSchema>;
