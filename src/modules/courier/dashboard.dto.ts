/**
 * Courier dashboard — wire DTO.
 *
 * Counts are derived from the real relationships:
 *   - activeAssignments: count of assignments where courier_id = me AND
 *     neither rejected_at nor unassigned_at are set.
 *   - openTasks: count of distinct field_task_id values reached through
 *     active assignments, whose parent task is not terminal (not cancelled,
 *     not completed).
 *   - pendingProofs / pendingUpdates are not computed without a stable
 *     "pending" definition in the schema; left null with a comment.
 */

import type { CourierProfileDto } from "./profile.dto";

export interface CourierDashboardDto {
  profile: CourierProfileDto;
  totals: {
    activeAssignments: number;
    openTasks: number;
    /**
     * No explicit "pending proof" or "pending update" flag exists in the
     * schema (the CSV reference does not expose such a column). Null means
     * "not derivable from the current schema", not zero.
     */
    pendingProofs: number | null;
    pendingUpdates: number | null;
  };
}
