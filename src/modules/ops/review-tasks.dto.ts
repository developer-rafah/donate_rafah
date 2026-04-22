/**
 * Sorting review tasks — DTO + Zod schemas.
 *
 * Aligned to `public.sorting_review_tasks`. NOT NULL in DB:
 *   sorting_session_id, review_type, status, created_at, updated_at.
 *
 * `sorting_session_id` is supplied by the client on create (unlike sorted
 * items, this endpoint is NOT a child route of a session — it lives at
 * `/ops/sorting-review-tasks`). The service verifies the referenced
 * session belongs to one of the caller's organizations.
 */

import { z } from "@lib/validation";

export interface ReviewTaskDto {
  id: string;
  sortingSessionId: string;
  reviewType: string;
  assignedToUserId: string | null;
  status: string;
  dueAt: string | null;
  reviewNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewTaskRow {
  id: string;
  sorting_session_id: string;
  review_type: string;
  assigned_to_user_id: string | null;
  status: string;
  due_at: string | null;
  review_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toReviewTaskDto(row: ReviewTaskRow): ReviewTaskDto {
  return {
    id: row.id,
    sortingSessionId: row.sorting_session_id,
    reviewType: row.review_type,
    assignedToUserId: row.assigned_to_user_id,
    status: row.status,
    dueAt: row.due_at,
    reviewNotes: row.review_notes,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const createReviewTaskSchema = z
  .object({
    sorting_session_id: z.string().uuid(),
    review_type: z.string().min(1).max(100),
    assigned_to_user_id: z.string().uuid().optional(),
    status: z.string().min(1).max(100),
    due_at: z.string().datetime().optional(),
    review_notes: z.string().max(4000).optional(),
  })
  .strict();

export type CreateReviewTaskInput = z.infer<typeof createReviewTaskSchema>;

export const updateReviewTaskSchema = z
  .object({
    review_type: z.string().min(1).max(100).optional(),
    assigned_to_user_id: z.string().uuid().nullable().optional(),
    status: z.string().min(1).max(100).optional(),
    due_at: z.string().datetime().nullable().optional(),
    review_notes: z.string().max(4000).nullable().optional(),
    completed_at: z.string().datetime().nullable().optional(),
  })
  .strict()
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "At least one writable field must be provided",
  });

export type UpdateReviewTaskInput = z.infer<typeof updateReviewTaskSchema>;
