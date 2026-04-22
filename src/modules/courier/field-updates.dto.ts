/**
 * Courier field updates — DTO + Zod schema.
 *
 * Aligned to `public.field_updates`. Courier-writable fields are limited
 * by `COURIER_FIELD_UPDATE_CREATABLE_FIELDS` in the domain layer; the
 * Zod schema below mirrors that allowlist.
 */

import { z } from "@lib/validation";

export interface CourierFieldUpdateDto {
  id: string;
  fieldTaskId: string;
  courierId: string;
  updateType: string;
  statusId: string | null;
  title: string | null;
  notes: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  happenedAt: string;
  createdAt: string;
  createdBy: string | null;
}

export interface CourierFieldUpdateRow {
  id: string;
  field_task_id: string;
  courier_id: string;
  update_type: string;
  status_id: string | null;
  title: string | null;
  notes: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  happened_at: string;
  created_at: string;
  created_by: string | null;
}

export function toCourierFieldUpdateDto(row: CourierFieldUpdateRow): CourierFieldUpdateDto {
  return {
    id: row.id,
    fieldTaskId: row.field_task_id,
    courierId: row.courier_id,
    updateType: row.update_type,
    statusId: row.status_id,
    title: row.title,
    notes: row.notes,
    locationLatitude: row.location_latitude,
    locationLongitude: row.location_longitude,
    happenedAt: row.happened_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

/**
 * POST body for field updates. `field_task_id` and `courier_id` are NEVER
 * accepted from the client — sourced from the route param + auth context.
 * `created_by` is populated by the service from `ctx.user.id`.
 * `happened_at` defaults to "now" server-side if the client omits it.
 */
export const createFieldUpdateSchema = z
  .object({
    update_type: z.string().min(1).max(100),
    status_id: z.string().uuid().optional(),
    title: z.string().max(500).optional(),
    notes: z.string().max(4000).optional(),
    location_latitude: latitude.optional(),
    location_longitude: longitude.optional(),
    happened_at: z.string().datetime().optional(),
  })
  .strict();

export type CreateFieldUpdateInput = z.infer<typeof createFieldUpdateSchema>;
