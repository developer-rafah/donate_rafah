import "server-only";

/**
 * Workflow action logs service.
 *
 * Phase 8 exposes read-only listing of action logs. Writes happen only
 * through the progression service (append-only on successful advance).
 */

import type { OpsAuthedContext } from "@lib/auth";
import * as repo from "@repositories/workflow_action_logs/workflow-action-logs.repository";
import { assertInstanceInCallerOrgs } from "./instances.service";
import {
  toWorkflowActionLogDto,
  type WorkflowActionLogDto,
} from "@modules/workflow/action-logs.dto";

export async function listActionLogsForInstance(
  ctx: OpsAuthedContext,
  instanceId: string
): Promise<WorkflowActionLogDto[]> {
  await assertInstanceInCallerOrgs(ctx, instanceId);
  const rows = await repo.listByInstanceId(instanceId);
  return rows.map(toWorkflowActionLogDto);
}
