/**
 * Activity + audit logs — read-only DTOs.
 *
 * Aligned to `public.activity_logs` and `public.audit_logs`. Both are
 * org-scoped directly via `organization_id`. Phase 11 exposes
 * read-only endpoints; no creation helpers are exposed here.
 */

// ---- Activity ---------------------------------------------------------------

export interface ActivityLogDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  userId: string | null;
  actorType: string;
  entityType: string;
  entityId: string;
  actionCode: string;
  actionLabel: string | null;
  description: string | null;
  sourceChannel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadataJson: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface ActivityLogRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string | null;
  actor_type: string;
  entity_type: string;
  entity_id: string;
  action_code: string;
  action_label: string | null;
  description: string | null;
  source_channel: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata_json: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export function toActivityLogDto(row: ActivityLogRow): ActivityLogDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    userId: row.user_id,
    actorType: row.actor_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actionCode: row.action_code,
    actionLabel: row.action_label,
    description: row.description,
    sourceChannel: row.source_channel,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadataJson: row.metadata_json ?? {},
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

// ---- Audit ------------------------------------------------------------------

export interface AuditLogDto {
  id: string;
  organizationId: string;
  branchId: string | null;
  actorUserId: string | null;
  actorType: string;
  entityType: string;
  entityId: string;
  eventType: string;
  reasonRefId: string | null;
  oldValuesJson: Record<string, unknown>;
  newValuesJson: Record<string, unknown>;
  diffJson: Record<string, unknown>;
  sourceChannel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadataJson: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface AuditLogRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  actor_user_id: string | null;
  actor_type: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  reason_ref_id: string | null;
  old_values_json: Record<string, unknown> | null;
  new_values_json: Record<string, unknown> | null;
  diff_json: Record<string, unknown> | null;
  source_channel: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata_json: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export function toAuditLogDto(row: AuditLogRow): AuditLogDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    actorUserId: row.actor_user_id,
    actorType: row.actor_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    eventType: row.event_type,
    reasonRefId: row.reason_ref_id,
    oldValuesJson: row.old_values_json ?? {},
    newValuesJson: row.new_values_json ?? {},
    diffJson: row.diff_json ?? {},
    sourceChannel: row.source_channel,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadataJson: row.metadata_json ?? {},
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}
