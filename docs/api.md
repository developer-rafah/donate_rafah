# API

Base: `/api/v1`

All responses use the standard envelope:

```jsonc
// success
{ "success": true, "data": <payload> }

// error
{ "success": false, "error": { "code": "<CODE>", "message": "<human>" } }
```

## Error codes (stable)

| Code              | HTTP | Meaning                                        |
| ----------------- | ---- | ---------------------------------------------- |
| `BAD_REQUEST`     | 400  | Malformed request                              |
| `UNAUTHENTICATED` | 401  | Missing or invalid session                     |
| `FORBIDDEN`       | 403  | Authenticated but not authorized               |
| `NOT_FOUND`       | 404  | Resource does not exist                        |
| `CONFLICT`        | 409  | State conflict (duplicate, stale version, ...) |
| `VALIDATION_ERROR`| 422  | Schema validation failure. Includes `details[]` |
| `RATE_LIMITED`    | 429  | Rate limit exceeded (reserved for later phases) |
| `DEPENDENCY_ERROR`| 502  | Upstream dependency failed (e.g. DB)           |
| `INTERNAL_ERROR`  | 500  | Unhandled server error                         |

## Endpoints (Phase 1 + 2)

### `GET /api/v1/health`

Unauthenticated liveness probe.

**200**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "rafd",
    "version": "v1",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

### `GET /api/v1/me`

Returns the resolved current-user context. Requires an authenticated
Supabase session.

**200**

```jsonc
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "authUserId": "uuid" },
    "donor":   { "id": "uuid" } /* or null */,
    "courier": { "id": "uuid" } /* or null */,
    "memberships": [
      {
        "id": "uuid",
        "organizationId": "uuid",
        "branchId": "uuid" /* or null */,
        "roles": [{ "id": "uuid", "code": "admin" }]
      }
    ]
  }
}
```

**401**

```json
{
  "success": false,
  "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" }
}
```

## Adding a new endpoint

1. Define Zod schemas + DTOs in `src/modules/<module>/...`.
2. Add a repository method under `src/repositories/<module>/...` if a new
   DB read/write is involved.
3. Add or extend a service in `src/services/<module>/...` for the use case.
4. Create a thin handler in `app/api/v1/<module>/...`:
   ```ts
   export const POST = withAuthHandler(async (req, ctx) => {
     const input = await parseJsonBody(req, someSchema);
     const result = await someService(ctx, input);
     return ok(result, { status: 201 });
   });
   ```
5. Document the endpoint here.

## Endpoints (Phase 3 — Donor Backend)

All donor endpoints:

- require an authenticated Supabase session
- require the authenticated user to have a donor row (`public.donors.user_id = public.users.id`)
- return `FORBIDDEN` if the user is authenticated but not a donor
- return `UNAUTHENTICATED` if no session is present
- scope every read/write to the caller's own donor; ownership is enforced in both the service layer and the repository WHERE clause

### `GET /api/v1/donor/profile`

Returns the donor's profile view. Phone/email are sourced from
`users.primary_phone` / `users.primary_email` — the `profiles` table does
not carry contact channels.

**200**

```jsonc
{
  "success": true,
  "data": {
    "donor": { "id": "uuid", "userId": "uuid" },
    "user":  {
      "id": "uuid",
      "authUserId": "uuid",
      "primaryPhone": "+9665..." /* or null */,
      "primaryEmail": "donor@example.com" /* or null */
    },
    "profile": {
      "fullName": "Ahmed ...",
      "displayName": "Ahmed" /* or null */,
      "avatarFilePath": "profiles/abc.png" /* or null */,
      "preferredLanguage": "ar"
    } /* or null if no profile row */
  }
}
```

### `GET /api/v1/donor/contact-details`

Lists the donor's contact details, oldest first.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donorId": "uuid",
      "mobileNumber": "+9665...",
      "secondaryMobileNumber": null,
      "email": "donor@example.com" /* or null */,
      "cityRefId": "uuid" /* or null */,
      "districtRefId": "uuid" /* or null */,
      "addressLine": "..." /* or null */,
      "latitude": 24.47,
      "longitude": 39.61,
      "preferredContactTime": "mornings" /* or null */,
      "contactNotes": null,
      "isPrimary": true,
      "createdAt": "2025-...",
      "updatedAt": "2025-..."
    }
  ]
}
```

### `PATCH /api/v1/donor/contact-details`

Updates a single contact-details row owned by the caller. Unknown keys are
rejected (`VALIDATION_ERROR`). Rows not owned by the caller fail as
`NOT_FOUND` — we do not confirm or deny existence of other donors' rows.

**Body**

```jsonc
{
  "id": "uuid",
  "mobile_number": "+9665...",              // optional, min 3 chars
  "secondary_mobile_number": "+9665...",    // optional, nullable
  "email": "donor@example.com",             // optional, nullable
  "city_ref_id": "uuid",                     // optional, nullable
  "district_ref_id": "uuid",                 // optional, nullable
  "address_line": "...",                     // optional, nullable
  "latitude": 24.47,                         // optional, nullable, -90..90
  "longitude": 39.61,                        // optional, nullable, -180..180
  "preferred_contact_time": "mornings",     // optional, nullable
  "contact_notes": "...",                   // optional, nullable
  "is_primary": true                         // optional
}
```

At least one writable field must be present alongside `id`.

**200**

Returns the updated row in the same shape as the list endpoint.

### `GET /api/v1/donor/profile-update-requests`

Lists the caller's profile update requests, newest first (by `submitted_at`).

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donorId": "uuid",
      "requestedByUserId": "uuid",
      "requestType": "personal_info",
      "currentDataJson": { "fullName": "Old Name" },
      "requestedDataJson": { "fullName": "New Name" },
      "status": "pending",
      "submittedAt": "2025-...",
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewNotes": null,
      "createdAt": "2025-...",
      "updatedAt": "2025-..."
    }
  ]
}
```

### `POST /api/v1/donor/profile-update-requests`

Creates a profile update request for the caller. `donor_id`,
`requested_by_user_id`, and `submitted_at` are taken from the
authenticated context / server clock and cannot be supplied by the
client. `status` is DB-defaulted; reviewer fields are null until review.

**Body**

```jsonc
{
  "request_type": "personal_info",                // required, 1..100 chars
  "current_data_json": { "fullName": "Old Name" }, // required object, ≤64 top-level keys
  "requested_data_json": { "fullName": "New Name" } // required non-empty object, ≤64 keys
}
```

**201**

Returns the created row.

### `GET /api/v1/donor/dashboard`

Aggregated summary for the donor home screen. All totals come from
maintained counters — `points` and `donations` are read directly from
`donors.total_points` / `donors.total_donations_count`, badges and
certificates are counted from their respective tables.

**200**

```jsonc
{
  "success": true,
  "data": {
    "profile": { /* same shape as /donor/profile */ },
    "totals": {
      "points": 1200,
      "badges": 4,
      "certificates": 2,
      "donations": 7
    },
    "latestRequest": null   /* reserved; presentation concern */
  }
}
```

### `GET /api/v1/donor/notifications`

Lists notifications addressed to the caller — either directly via
`notification_recipients.donor_id` or via `notification_recipients.user_id`.
Rows whose parent notification has been deleted are filtered out.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "recipientId": "uuid",
      "notificationId": "uuid",
      "subjectText": "..." /* or null */,
      "messageBody": "...",
      "notificationType": "system",
      "channel": "in_app",
      "deliveryStatus": "delivered",
      "deliveredAt": "2025-..." /* or null */,
      "readAt": null,
      "createdAt": "2025-..."
    }
  ]
}
```

### `GET /api/v1/donor/points`

Lists points ledger entries for the donor, newest first (by `awarded_at`).
The running balance is maintained on each row as `balanceAfter` and also
available as a single-number summary in the dashboard.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donorId": "uuid",
      "pointsDelta": 50,
      "balanceAfter": 1200,
      "ledgerType": "credit",
      "notes": "donation_accepted" /* or null */,
      "awardedAt": "2025-..."
    }
  ]
}
```

### `GET /api/v1/donor/badges`

Lists badge awards for the donor, newest first. Display labels are
multilingual (`nameAr` / `nameEn`) — the client picks the active locale.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donorId": "uuid",
      "awardedAt": "2025-...",
      "awardReason": "first_donation_completed" /* or null */,
      "badge": {
        "id": "uuid",
        "badgeCode": "first_donation",
        "nameAr": "أول تبرع",
        "nameEn": "First Donation" /* or null */,
        "iconFilePath": "badges/first_donation.png" /* or null */,
        "badgeLevel": 1
      } /* or null if badge row was removed */
    }
  ]
}
```

### `GET /api/v1/donor/certificates`

Lists issued certificates for the donor, newest first. PDF delivery is via
`pdfAttachmentId` (resolve through the attachments module when building
the download URL); `verificationCode` lets third parties verify the
certificate against the organization's issuance record.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donorId": "uuid",
      "certificateNumber": "CERT-2025-000123",
      "issueStatus": "issued",
      "issuedAt": "2025-..." /* or null if pending */,
      "verificationCode": "abc123" /* or null */,
      "pdfAttachmentId": "uuid" /* or null */,
      "template": {
        "id": "uuid",
        "templateCode": "annual_thank_you",
        "nameAr": "شهادة شكر سنوية",
        "nameEn": "Annual Thank-You Certificate" /* or null */
      } /* or null if template row was removed */
    }
  ]
}
```

## Endpoints (Phase 4 — Donor requests & pickup logistics)

All endpoints below require an authenticated donor (same gate as Phase 3).

### `GET /api/v1/donor/pickup-locations`

Lists pickup locations owned by the caller, oldest first.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid" /* or null */,
      "donorId": "uuid",
      "cityRefId": "uuid" /* or null */,
      "districtRefId": "uuid" /* or null */,
      "addressLine": "...",
      "landmark": "Near the main mosque",
      "buildingTypeRefId": "uuid" /* or null */,
      "floorNumber": 3,
      "hasElevator": true,
      "parkingNotes": "Parking on side street",
      "latitude": 24.47,
      "longitude": 39.61,
      "isDefault": true,
      "createdAt": "2025-...",
      "updatedAt": null
    }
  ]
}
```

### `POST /api/v1/donor/pickup-locations`

Creates a pickup location. `donor_id`, `organization_id`, and audit fields
are derived server-side and cannot be supplied by the client.

**Body**

```jsonc
{
  "address_line": "...",                  // required
  "city_ref_id": "uuid",                   // optional
  "district_ref_id": "uuid",               // optional
  "landmark": "Near the main mosque",     // optional
  "building_type_ref_id": "uuid",          // optional
  "floor_number": 3,                       // optional
  "has_elevator": true,                    // optional
  "parking_notes": "Parking on side",     // optional
  "latitude": 24.47,                       // optional, -90..90
  "longitude": 39.61,                      // optional, -180..180
  "is_default": true                       // optional
}
```

**201** returns the created row.

### `PATCH /api/v1/donor/pickup-locations`

Updates a pickup location owned by the caller. Unknown keys are rejected.
Rows not owned by the caller return NOT_FOUND.

**Body**

```jsonc
{
  "id": "uuid",
  "address_line": "...",                   // any writable field optional
  "city_ref_id": "uuid",
  "district_ref_id": "uuid",
  "landmark": "...",
  "building_type_ref_id": "uuid",
  "floor_number": 2,
  "has_elevator": false,
  "parking_notes": "...",
  "latitude": 21.49,
  "longitude": 39.18,
  "is_default": false
}
```

At least one writable field must be present alongside `id`.

### `GET /api/v1/donor/schedule-slots`

Read-only catalog of donor-visible pickup slots (those with
`status = 'open'`, ordered by date then start time). Useful for building
the request creation UI.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid" /* or null */,
      "branchId": "uuid" /* or null */,
      "slotDate": "2026-05-01",
      "startTime": "09:00:00",
      "endTime": "12:00:00",
      "capacityLimit": 10,
      "reservedCount": 3,
      "status": "open",
      "slotType": "pickup" /* or null */,
      "cityRefId": "uuid" /* or null */,
      "districtRefId": "uuid" /* or null */
    }
  ]
}
```

### `GET /api/v1/donor/requests`

Lists the caller's own donation requests, newest first.

### `POST /api/v1/donor/requests`

Creates a donation request. Only donor-facing fields are accepted; unknown
keys are rejected by `.strict()` validation.

**Body**

```jsonc
{
  "pickup_location_id": "uuid",          // optional; must be owned by caller if present
  "donation_type_ref_id": "uuid",        // optional
  "donation_category_ref_id": "uuid",    // optional
  "summary_description": "Boxes of clothing and toys",
  "estimated_quantity_text": "~5 medium boxes",   // optional
  "donor_notes": "Available afternoons"           // optional
}
```

Server-assigned / rejected from body:
`donor_id`, `organization_id`, `branch_id`, `request_number`,
`current_status_id`, `priority_level`, `cancellation_reason_ref_id`,
`submitted_at`, `closed_at`, `cancelled_at`,
`created_by`, `updated_by`, `source_channel`.

**201** returns the created row. The `currentStatusId` is resolved server-side
(see "Assumptions" in docs/architecture.md for fallback behaviour).

### `GET /api/v1/donor/requests/[id]`

Returns one donation request owned by the caller. `NOT_FOUND` for missing
or foreign-owned ids.

### `GET /api/v1/donor/requests/[id]/details`

Lists the detail lines of a request owned by the caller.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donationRequestId": "uuid",
      "donorInputJson": {
        "items": [{ "description": "Men's winter coats", "quantity": 12, "unit": "pieces" }]
      },
      "photosCount": 4,
      "hasFragileItems": false,
      "hasHeavyItems": true,
      "requiresSpecialHandling": false,
      "additionalNotes": "Available afternoons only",
      "createdAt": "2025-...",
      "updatedAt": null
    }
  ]
}
```

### `POST /api/v1/donor/requests/[id]/details`

Adds a detail line to a request owned by the caller.

**Body**

```jsonc
{
  "donor_input_json": {
    "items": [{ "description": "Men's winter coats", "quantity": 12, "unit": "pieces" }]
  },                                        // required, non-empty, ≤ 64 top-level keys
  "photos_count": 4,                        // optional, 0..1000
  "has_fragile_items": false,               // optional
  "has_heavy_items": true,                  // optional
  "requires_special_handling": false,       // optional
  "additional_notes": "Afternoons only"     // optional, ≤ 4000 chars
}
```

**201** returns the created row.

### `GET /api/v1/donor/requests/[id]/bookings`

Read-only list of bookings linked to a request owned by the caller.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "donationRequestId": "uuid",
      "scheduleSlotId": "uuid" /* or null */,
      "bookingStatus": "scheduled",
      "bookedAt": "2026-05-01T10:00:00Z",
      "rescheduledFromBookingId": null,
      "rescheduledReasonRefId": null,
      "cancelledAt": null,
      "createdAt": "2025-...",
      "updatedAt": null
    }
  ]
}
```

Booking creation and lifecycle changes belong to later phases and are NOT
exposed here.

## Endpoints (Phase 5 — Courier & field operations)

All courier endpoints:

- require an authenticated Supabase session
- require the authenticated user to have a courier row (`public.couriers.user_id = public.users.id`)
- return `FORBIDDEN` if the user is authenticated but not a courier
- return `UNAUTHENTICATED` if no session is present
- scope every read/write to the caller's own courier; ownership of a task is established via an **active assignment** (no `rejected_at` and no `unassigned_at` set)
- return `NOT_FOUND` (not `FORBIDDEN`) for task ids that do not exist or are not owned by the caller, to avoid leaking existence of other couriers' tasks

### `GET /api/v1/courier/profile`

Returns the courier's profile view.

**200**

```jsonc
{
  "success": true,
  "data": {
    "courier": {
      "id": "uuid",
      "organizationId": "uuid",
      "branchId": "uuid" /* or null */,
      "userId": "uuid",
      "courierCode": "CR-1042",
      "status": "active",
      "vehicleTypeRefId": "uuid" /* or null */,
      "maxDailyTasks": 8,
      "isActiveForAssignment": true,
      "employmentTypeRefId": "uuid" /* or null */,
      "notes": null
    },
    "user": {
      "id": "uuid",
      "authUserId": "uuid",
      "primaryPhone": "+9665...",
      "primaryEmail": "courier@example.com"
    },
    "profile": {
      "fullName": "...",
      "displayName": "...",
      "avatarFilePath": "profiles/xyz.png",
      "preferredLanguage": "ar"
    } /* or null if no profile row */
  }
}
```

### `GET /api/v1/courier/dashboard`

Aggregated summary for the courier home screen.

**200**

```jsonc
{
  "success": true,
  "data": {
    "profile": { /* same shape as /courier/profile */ },
    "totals": {
      "activeAssignments": 3,
      "openTasks": 2,
      "pendingProofs": null,   /* not derivable from current schema */
      "pendingUpdates": null   /* not derivable from current schema */
    }
  }
}
```

### `GET /api/v1/courier/assignments`

Lists assignments belonging to the caller, newest first by `assigned_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fieldTaskId": "uuid",
      "courierId": "uuid",
      "assignmentStatusId": "uuid" /* or null */,
      "assignedAt": "2026-...",
      "acceptedAt": "2026-..." /* or null */,
      "rejectedAt": null,
      "unassignedAt": null,
      "assignedBy": "uuid" /* or null */,
      "assignmentMethod": "manual",
      "assignmentNotes": null,
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `GET /api/v1/courier/tasks`

Lists field tasks the caller owns via an active assignment, soonest-scheduled first.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "branchId": "uuid" /* or null */,
      "donationRequestId": "uuid",
      "bookingId": "uuid" /* or null */,
      "taskNumber": "TASK-000123",
      "taskStatusId": "uuid" /* or null */,
      "taskType": "pickup",
      "scheduledDate": "2026-05-01",
      "scheduledStartTime": "09:00:00",
      "scheduledEndTime": "12:00:00",
      "startedAt": null,
      "completedAt": null,
      "cancelledAt": null,
      "notes": null,
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `GET /api/v1/courier/tasks/[id]`

Returns one task the caller owns. `NOT_FOUND` for missing or
foreign-owned ids.

### `GET /api/v1/courier/tasks/[id]/updates`

Lists field updates posted against the task, newest first by `happened_at`.

### `POST /api/v1/courier/tasks/[id]/updates`

Creates a field update. `field_task_id` and `courier_id` are derived from
the route + auth context. `created_by` is the acting user. `happened_at`
defaults to "now" server-side when omitted.

**Body**

```jsonc
{
  "update_type": "arrived_at_pickup",     // required
  "status_id": "uuid",                     // optional
  "title": "On-site",                      // optional
  "notes": "Parked on street",            // optional
  "location_latitude": 24.47,              // optional, -90..90
  "location_longitude": 39.61,             // optional, -180..180
  "happened_at": "2026-05-01T09:15:00Z"   // optional, ISO datetime
}
```

**201** returns the created row.

### `GET /api/v1/courier/tasks/[id]/proofs`

Lists field proofs attached to the task, newest first by `captured_at`.

### `POST /api/v1/courier/tasks/[id]/proofs`

Creates a field proof **metadata** row. The file itself must already have
been uploaded through the attachments module; pass the resulting id here.

**Body**

```jsonc
{
  "proof_type": "handover_signature",     // required
  "attachment_id": "uuid",                 // required — existing public.attachments row
  "field_update_id": "uuid",               // optional — link to a specific update
  "notes": "signed by recipient",         // optional
  "captured_at": "2026-05-01T10:30:00Z"   // optional, ISO datetime
}
```

**201** returns the created row.

### `GET /api/v1/courier/tasks/[id]/intake`

Returns the intake record for the task, or `null` when none exists yet.

### `POST /api/v1/courier/tasks/[id]/intake`

Creates the intake record. One intake per task — a second POST for the
same task returns `CONFLICT`. Identity fields (`organization_id`,
`donation_request_id`, `field_task_id`, `courier_id`, `branch_id`) are
derived server-side; the body accepts only donor-handover-relevant fields.

**Body**

```jsonc
{
  "intake_status": "received",                      // required
  "pickup_completed_at": "2026-05-01T10:25:00Z",  // optional
  "received_quantity_text": "~4 boxes",           // optional
  "courier_notes": "Donor handed over at door",   // optional
  "recipient_confirmation_method": "signature",    // optional
  "requires_sorting": true                          // optional, defaults to false
}
```

**201** returns the created row.

### `PATCH /api/v1/courier/tasks/[id]/intake`

Updates the intake record for the task. `NOT_FOUND` when no record exists
yet (POST to create first). At least one writable field required.

Accepts the same keys as POST, all optional, with nullable clearing for
the optional strings/timestamps.

## Endpoints (Phase 6 — Sorting backend, internal ops)

All endpoints below:

- require an authenticated Supabase session
- require the caller to have at least one `public.memberships` row (i.e. be internal staff)
- return `FORBIDDEN` if the caller is authenticated but has no membership
- return `UNAUTHENTICATED` if no session is present
- scope every read/write to the caller's **organization set** — rows in other
  organizations map to `NOT_FOUND`, never `FORBIDDEN`, to avoid existence leaks
- follow the same `{success, data}` / `{success, error}` envelope as the rest
  of the API

**Assumption**: "any active membership = internal ops access". The CSV schema
reference does not expose ops-specific role codes, so a finer-grained gate
(e.g. role code `ops_sorter`) cannot be enforced without fabricating values.
A later phase can tighten this by checking role codes on
`ctx.memberships[].roles[].code`.

### `GET /api/v1/ops/sorting-sessions`

Lists sorting sessions the caller can see (across their org set), newest first.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "branchId": "uuid" /* or null */,
      "donationRequestId": "uuid",
      "intakeRecordId": "uuid",
      "sortingStatus": "in_progress",
      "startedAt": "2026-...",
      "completedAt": null,
      "sortedBy": "uuid" /* or null */,
      "reviewedBy": null,
      "reviewedAt": null,
      "reviewNotes": null,
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `POST /api/v1/ops/sorting-sessions`

Creates a sorting session. The service verifies the target
`donation_request_id` belongs to one of the caller's organizations AND
that `intake_record_id` references the same `donation_request_id` (mutual
consistency). `organization_id` is derived from the donation request.
`branch_id` defaults to the intake's branch when omitted.

**Body**

```jsonc
{
  "donation_request_id": "uuid",
  "intake_record_id": "uuid",
  "branch_id": "uuid",             // optional
  "sorting_status": "pending"
}
```

**201** returns the created row.

### `GET /api/v1/ops/sorting-sessions/[id]`

Returns one session. `NOT_FOUND` for missing or foreign-org ids.

### `PATCH /api/v1/ops/sorting-sessions/[id]`

Updates a session. `sorted_by` / `reviewed_by` are NOT writable — they
are populated by the workflow engine in a later phase. Identity fields
(`organization_id`, `donation_request_id`, `intake_record_id`) are never
writable.

**Body** (all optional, at least one required)

```jsonc
{
  "sorting_status": "completed",
  "started_at":   "2026-05-01T09:00:00Z",   // nullable
  "completed_at": "2026-05-01T13:00:00Z",   // nullable
  "reviewed_at":  null,
  "review_notes": "...",                     // nullable
  "branch_id":    "uuid"                     // nullable
}
```

### `GET /api/v1/ops/sorting-sessions/[id]/items`

Lists sorted items in a session, oldest first by `created_at`.

### `POST /api/v1/ops/sorting-sessions/[id]/items`

Creates a sorted item bound to the session in the route. `is_approved`
defaults to `false` when omitted.

**Body**

```jsonc
{
  "item_name": "Winter jackets, size M",    // required
  "quantity": 12,                            // required, int ≥ 0

  "item_classification_id": "uuid",         // optional
  "donation_type_ref_id": "uuid",           // optional
  "donation_category_ref_id": "uuid",       // optional
  "item_description": "...",                 // optional
  "quantity_unit_ref_id": "uuid",           // optional
  "condition_assessment_id": "uuid",        // optional
  "estimated_value_amount": "250.00",       // optional, numeric (string or number)
  "estimated_value_currency": "SAR",        // optional, 3 chars
  "sorting_decision_id": "uuid",            // optional
  "is_approved": false,                      // optional, default false
  "notes": "..."                             // optional
}
```

**201** returns the created row.

### `PATCH /api/v1/ops/sorted-items/[itemId]`

Updates a sorted item. Ownership is enforced via the caller's org set.
Any writable field may be cleared to null (where nullable in schema).

### `GET /api/v1/ops/sorted-items/[itemId]/estimated-values`

Lists estimated values for a sorted item, newest first.

### `POST /api/v1/ops/sorted-items/[itemId]/estimated-values`

Creates an estimated value row. `sorting_session_id` is derived from the
parent item; `valued_by` is set to the acting user. `approved_by` /
`approved_at` are NOT writable — approvals belong to a later phase.

**Body**

```jsonc
{
  "valuation_type": "market",      // required
  "estimated_amount": "2500.00",   // required, numeric (string or number)
  "currency_code": "SAR",          // required, 3 chars
  "status": "pending",             // required
  "valuation_notes": "..."         // optional
}
```

**201** returns the created row.

### `GET /api/v1/ops/sorting-sessions/[id]/decision-logs`

Lists decision-log entries for a session, newest first by `decided_at`.

### `POST /api/v1/ops/sorting-sessions/[id]/decision-logs`

Appends a decision-log entry. `sorting_session_id` comes from the route;
`decided_by` is set to the acting user; `decided_at` defaults to "now"
server-side when omitted. If `sorted_item_id` is supplied, the service
verifies it belongs to the parent session.

**Body**

```jsonc
{
  "decision_id": "uuid",            // required
  "sorted_item_id": "uuid",         // optional
  "decision_notes": "...",          // optional
  "decided_at": "2026-..."          // optional, ISO datetime
}
```

**201** returns the created row.

### `GET /api/v1/ops/sorting-review-tasks`

Lists review tasks across all sessions the caller can see, newest first.

### `POST /api/v1/ops/sorting-review-tasks`

Creates a review task. Unlike items, this is NOT a child route of a
session — `sorting_session_id` is supplied in the body and verified by
the service to belong to one of the caller's orgs.

**Body**

```jsonc
{
  "sorting_session_id": "uuid",         // required
  "review_type": "quality_check",       // required
  "status": "pending",                   // required

  "assigned_to_user_id": "uuid",        // optional
  "due_at": "2026-...",                 // optional, ISO datetime
  "review_notes": "..."                 // optional
}
```

**201** returns the created row.

### `GET /api/v1/ops/sorting-review-tasks/[id]`

Returns one review task. `NOT_FOUND` for missing or foreign-org ids.

### `PATCH /api/v1/ops/sorting-review-tasks/[id]`

Updates a review task. This phase does NOT enforce status-transition
legality — any schema-valid patch is accepted. The workflow engine in a
later phase owns transition rules.

**Body** (all optional, at least one required)

```jsonc
{
  "review_type": "...",
  "assigned_to_user_id": "uuid",      // nullable
  "status": "in_progress",
  "due_at": "2026-...",                // nullable
  "review_notes": "...",               // nullable
  "completed_at": "2026-..."           // nullable
}
```

## Endpoints (Phase 7 — Approvals backend, internal ops)

All endpoints below share the Phase 6 ops auth gate (`withOps` / `requireOps`):

- require an authenticated Supabase session
- require at least one `public.memberships` row
- return `FORBIDDEN` for authenticated users with no membership
- return `UNAUTHENTICATED` when no session is present
- scope every read/write to the caller's **organization set** — rows in
  other orgs map to `NOT_FOUND`, never `FORBIDDEN`, to avoid existence leaks

**Decision history is append-only.** There is no endpoint to update or
delete an `approval_decisions` row in this phase. The parent
`approval_requests.request_status` / `decision` / `reviewed_*` columns are
**not** mutated by any Phase 7 endpoint — aggregating decisions into the
parent request is workflow logic and belongs to a later phase.

### `GET /api/v1/ops/approval-requests`

Lists approval requests the caller can see (across their org set),
newest first by `submitted_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "branchId": "uuid" /* or null */,
      "approvalTypeId": "uuid",
      "entityType": "sorting_session",
      "entityId": "uuid",
      "requestStatus": "pending",
      "submittedBy": "uuid",
      "submittedAt": "2026-...",
      "assignedToUserId": "uuid" /* or null */,
      "reviewedBy": null,
      "reviewedAt": null,
      "decision": null,
      "decisionReasonRefId": null,
      "reviewNotes": null,
      "payloadJson": { /* arbitrary */ },
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `POST /api/v1/ops/approval-requests`

Creates an approval request. `organization_id` is derived from the
`approval_type` (which must belong to one of the caller's orgs).
`submitted_by` is the acting user; `submitted_at` is set server-side;
`request_status` defaults to `"pending"`.

The request's `entity_type` must match the type's declared `entity_type` —
mismatch is rejected with `BAD_REQUEST`.

**Body**

```jsonc
{
  "approval_type_id": "uuid",           // required
  "entity_type": "sorting_session",     // required, must match approval_type
  "entity_id": "uuid",                   // required
  "branch_id": "uuid",                   // optional
  "assigned_to_user_id": "uuid",        // optional
  "payload_json": { }                    // optional, ≤128 keys
}
```

**201** returns the created row.

### `GET /api/v1/ops/approval-requests/[id]`

Returns one approval request. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/approval-requests/[id]/decisions`

Returns the append-only decision history for a request, oldest first
by `decided_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "approvalRequestId": "uuid",
      "approvalChainStepId": "uuid",
      "decisionByUserId": "uuid",
      "decisionStatus": "approved",
      "decisionNotes": "...",
      "decisionReasonRefId": null,
      "decidedAt": "2026-...",
      "createdAt": "2026-..."
    }
  ]
}
```

### `POST /api/v1/ops/approval-requests/[id]/decisions`

Records a decision on the currently-pending step of a request. The
service:

1. Resolves the governing chain via
   `(organization_id, approval_type_id, entity_type)` filtered to
   `is_active = true`; prefers the branch-specific chain over the
   org-wide chain, and `is_default = true` within the chosen pool.
2. Loads the chain's steps in `step_order` and the request's decisions.
3. Picks the first `is_required = true` step that does not yet have an
   approved decision. If every required step is already approved, the
   chain is satisfied and the endpoint returns `CONFLICT`.
4. Checks caller eligibility for that step:
   - If `specific_user_id` is set, only that user is eligible.
   - Else if `role_id` is set, the caller must hold that role in the
     request's organization.
   - Else (both null), any ops member of that organization is eligible.
5. Rejects double-submissions by the same user on the same step
   (`CONFLICT`).

**Body**

```jsonc
{
  "decision_status": "approved",         // required
  "decision_notes": "looks good",        // optional
  "decision_reason_ref_id": "uuid",     // optional
  "approval_chain_step_id": "uuid",     // optional — if supplied, must match the pending step
  "decided_at": "2026-..."              // optional, ISO datetime; defaults to now
}
```

**201** returns the created decision.

**Failure modes specific to this endpoint:**

| Code | When |
|---|---|
| `NOT_FOUND` | Request id does not exist or is in another org |
| `DEPENDENCY_ERROR` | No active approval chain is configured for the request's scope |
| `CONFLICT` | No pending step (chain already satisfied), supplied step id mismatches pending step, or caller already decided on this step |
| `FORBIDDEN` | Caller is not eligible for the pending step |
| `BAD_REQUEST` | `decision_status` is empty |
| `VALIDATION_ERROR` | Unknown body keys, wrong types |

## Endpoints (Phase 8 — Workflow backend, internal ops)

All endpoints share the Phase 6 ops auth gate (`withOps` / `requireOps`):

- require an authenticated Supabase session
- require at least one `public.memberships` row
- return `FORBIDDEN` for authenticated users with no membership
- return `UNAUTHENTICATED` when no session is present
- scope every read/write via the parent template's `organization_id` —
  `workflow_instances` itself has no `organization_id` column; scoping
  goes through `workflow_templates`

**Decision model.** This phase implements a narrow advance flow, not a
general rule engine. `workflow_transition_rules.condition_payload_json`
is NOT evaluated automatically — the caller either relies on the
single-outgoing-transition fast path or disambiguates explicitly with
`transition_rule_id`.

### `GET /api/v1/ops/workflow-templates`

Lists workflow templates the caller can see, newest first.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "templateCode": "sorting_approval_v1",
      "nameAr": "...",
      "nameEn": "Sorting Approval v1",
      "description": null,
      "entityType": "sorting_session",
      "donationTypeRefId": null,
      "donationCategoryRefId": null,
      "branchId": null,
      "isDefault": true,
      "isActive": true,
      "versionNumber": 1,
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `GET /api/v1/ops/workflow-templates/[id]`

Returns one template. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/workflow-instances`

Lists workflow instances whose parent template belongs to one of the
caller's orgs, newest first by `started_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workflowTemplateId": "uuid",
      "entityType": "sorting_session",
      "entityId": "uuid",
      "currentStepId": "uuid",
      "instanceStatus": "active",
      "startedAt": "2026-...",
      "completedAt": null,
      "cancelledAt": null,
      "createdAt": "2026-...",
      "updatedAt": "2026-...",
      "createdBy": "uuid"
    }
  ]
}
```

### `POST /api/v1/ops/workflow-instances`

Creates an instance for a valid entity. The service:

1. Verifies the `workflow_template_id` belongs to one of the caller's
   orgs and is active.
2. Requires `entity_type` to match the template's declared `entity_type`
   (mismatch → `BAD_REQUEST`).
3. Resolves the template's initial step (`is_initial = true`, lowest
   `sort_order`). If the template has no initial step, surfaces
   `DEPENDENCY_ERROR` (configuration problem).
4. Creates the instance with `current_step_id` set to that initial step,
   `instance_status = "active"`, `started_at = now()`, `created_by` =
   acting user.
5. Creates the matching `workflow_step_instances` row for the initial
   step (`step_status = "active"`, `payload_json = {}`, `started_at`
   populated when the step's `auto_start` is true).

**Body**

```jsonc
{
  "workflow_template_id": "uuid",     // required
  "entity_type": "sorting_session",   // required, must match template
  "entity_id": "uuid"                  // required
}
```

**201** returns the created instance.

### `GET /api/v1/ops/workflow-instances/[id]`

Returns one instance. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/workflow-instances/[id]/steps`

Lists step instances for the workflow instance, oldest first by
`created_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workflowInstanceId": "uuid",
      "workflowStepId": "uuid",
      "stepStatus": "active",
      "assignedToUserId": null,
      "assignedToRoleId": "uuid",
      "startedAt": "2026-...",
      "completedAt": null,
      "skippedAt": null,
      "dueAt": null,
      "resultCode": null,
      "notes": null,
      "payloadJson": {},
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `POST /api/v1/ops/workflow-instances/[id]/advance`

Advances a workflow instance by one transition. Actor identity is taken
from the auth context. The body only carries:

- `transition_rule_id` (optional) — required only when the current
  step has multiple active outgoing transitions
- `notes` (optional) — recorded on the outgoing step_instance's `notes`
- `automation_action_id` (optional) — when provided, an append-only
  `workflow_action_logs` row is written with `execution_status = "success"`
- `log_request_payload_json` / `log_response_payload_json` (optional) —
  payloads carried into the action log when logging is enabled

The service:

1. Verifies the instance is visible in caller org scope.
2. Rejects progression on terminal instances (`completed_at` or
   `cancelled_at` set) → `CONFLICT`.
3. Loads active outgoing transitions ordered by `priority_order`.
4. Picks a transition:
   - If `transition_rule_id` is supplied, it must match one of the
     active outgoing transitions → else `BAD_REQUEST`.
   - If exactly one active transition exists, it's picked.
   - Otherwise → `CONFLICT` asking the caller to disambiguate.
5. Marks the outgoing step_instance `completed_at = now()`,
   `step_status = "completed"`, `result_code = <rule_name>`.
6. Creates a new step_instance for the destination step
   (`step_status = "active"`, `payload_json = {}`, `started_at` populated
   iff destination's `auto_start` is true, `assigned_to_role_id` copied
   from the step definition).
7. Updates `workflow_instances.current_step_id` to the destination.
8. If the destination step is terminal, sets
   `instance.completed_at = now()` and
   `instance.instance_status = "completed"`.
9. If `automation_action_id` was supplied, verifies it belongs to
   caller's org + is active, then appends a row to
   `workflow_action_logs`. Action logging is optional because
   `workflow_action_logs.automation_action_id` is NOT NULL and FK — the
   endpoint cannot fabricate a synthetic actions row.

**Body**

```jsonc
{
  "transition_rule_id": "uuid",          // optional
  "notes": "manual advance",             // optional
  "automation_action_id": "uuid",        // optional — enables logging
  "log_request_payload_json": { },       // optional
  "log_response_payload_json": { }       // optional
}
```

**200** returns the updated instance.

**Failure modes specific to this endpoint:**

| Code | When |
|---|---|
| `NOT_FOUND` | Instance missing / foreign-org; automation_action_id missing or foreign-org |
| `CONFLICT` | Instance terminal; no current step; zero outgoing transitions; multiple outgoing and no `transition_rule_id` |
| `BAD_REQUEST` | `transition_rule_id` supplied but matches no active outgoing transition; supplied automation action is inactive |
| `DEPENDENCY_ERROR` | Transition references a missing destination step (configuration problem) |
| `VALIDATION_ERROR` | Unknown body keys, wrong types |

### `GET /api/v1/ops/workflow-instances/[id]/action-logs`

Lists append-only action log entries for the instance, oldest first by
`executed_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workflowInstanceId": "uuid",
      "workflowStepInstanceId": "uuid",
      "automationActionId": "uuid",
      "executionStatus": "success",
      "requestPayloadJson": { },
      "responsePayloadJson": { },
      "errorMessage": null,
      "executedAt": "2026-...",
      "createdAt": "2026-..."
    }
  ]
}
```

## Endpoints (Phase 9 — Templates & notifications backend, internal ops)

All endpoints share the ops auth gate (`withOps` / `requireOps`): authenticated
session + at least one `public.memberships` row. Rows in other orgs map to
`NOT_FOUND`, never `FORBIDDEN`, to avoid existence leaks.

**No external delivery side effects.** Every POST in this phase writes DB
rows only. Delivery outcome fields (`sent_at`, `delivered_at`, `read_at`,
`failed_at`, `failure_reason`) exist as read-only DTO surface but are NOT
writable through any Phase 9 endpoint — those belong to the
provider-execution phase.

### `GET /api/v1/ops/template-types`

Lists template types visible to the caller.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "code": "donation_receipt",
      "nameAr": "...",
      "nameEn": "Donation Receipt",
      "description": null,
      "supportedChannelsJson": { "sms": true, "email": true },
      "isActive": true,
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

### `GET /api/v1/ops/templates`

Lists templates in the caller's org set, newest first.

### `GET /api/v1/ops/templates/[id]`

Returns one template. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/templates/[id]/versions`

Lists versions for a template, newest version first.

### `GET /api/v1/ops/template-versions/[versionId]`

Returns one version. Scoping is joined through the parent template's
org — a foreign-org version id → `NOT_FOUND`.

### `GET /api/v1/ops/templates/[id]/variables`

Lists template variables, sorted by key.

### `GET /api/v1/ops/notifications`

Lists notifications in the caller's org set, newest first.

### `POST /api/v1/ops/notifications`

Creates a notification DB row. No external delivery is triggered. The
service derives `organization_id` via a priority chain:

1. If `template_id` is supplied, its organization is taken as the derived org.
2. The body's optional `organization_id` is compared against the derived org
   (mismatch → `BAD_REQUEST`).
3. Otherwise, when the caller belongs to exactly one organization, that org
   is used.
4. Multi-org callers with no `template_id` and no explicit `organization_id`
   → `BAD_REQUEST` (ambiguous scope).

`status` defaults to `"draft"`. `payload_json` defaults to `{}`. `created_by`
is the acting user. Delivery fields (`sent_at`, `failed_at`,
`failure_reason`) are NOT writable here.

**Body**

```jsonc
{
  "notification_type": "donation_received",   // required
  "channel": "email",                          // required
  "message_body": "Thank you for your donation.", // required

  "organization_id": "uuid",                   // optional
  "branch_id": "uuid",                         // optional
  "template_id": "uuid",                       // optional, must be in caller's orgs
  "target_type": "donor",                      // optional
  "target_id": "uuid",                         // optional
  "subject_text": "شكراً",                     // optional
  "scheduled_at": "2026-...",                  // optional, ISO datetime
  "payload_json": { }                          // optional, ≤128 keys
}
```

**201** returns the created row.

### `GET /api/v1/ops/notifications/[id]`

Returns one notification. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/notifications/[id]/recipients`

Lists recipients for a notification, oldest first.

### `POST /api/v1/ops/notifications/[id]/recipients`

Adds a recipient to a notification. `notification_id` comes from the
route. `delivery_status` defaults to `"pending"`. At least one of
`user_id`, `donor_id`, `recipient_phone`, `recipient_email` must be
supplied (`recipient_name` alone is insufficient — no delivery channel).

**Body**

```jsonc
{
  "user_id": "uuid",                // optional
  "donor_id": "uuid",               // optional
  "recipient_name": "Ahmed ...",    // optional
  "recipient_phone": "+9665...",    // optional
  "recipient_email": "x@y.com"      // optional
}
```

**201** returns the created row.

### `GET /api/v1/ops/communication-campaigns`

Lists campaigns in the caller's org set, newest first.

### `POST /api/v1/ops/communication-campaigns`

Creates a campaign. Same organization-resolution rules as notifications
(template-derived → explicit body → single-org fallback → ambiguous
error). `campaign_status` defaults to `"draft"`. `target_filter_json`
defaults to `{}` when omitted (NOT NULL in DB). `started_at` /
`completed_at` are delivery-outcome fields; NOT writable here.

**Creating a campaign does NOT automatically generate deliveries.**

**Body**

```jsonc
{
  "campaign_code": "q2_thankyou",              // required
  "name_ar": "حملة الشكر الربعية",              // required
  "campaign_type": "thank_you",                 // required
  "target_type": "donors",                       // required
  "channel": "email",                           // required

  "organization_id": "uuid",                    // optional
  "name_en": "Quarterly Thanks",                // optional
  "description": "...",                         // optional
  "template_id": "uuid",                        // optional
  "target_filter_json": { "donor_tier": "gold" }, // optional, ≤128 keys
  "scheduled_at": "2026-..."                    // optional, ISO datetime
}
```

**201** returns the created row.

### `GET /api/v1/ops/communication-campaigns/[id]`

Returns one campaign. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/communication-campaigns/[id]/deliveries`

Lists deliveries for a campaign, newest first. Read-only — no POST in
this phase.

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "campaignId": "uuid",
      "recipientType": "donor",
      "recipientId": "uuid" /* or null */,
      "notificationId": "uuid" /* or null */,
      "deliveryStatus": "sent",
      "sentAt": "2026-...",
      "deliveredAt": "2026-...",
      "readAt": null,
      "failedAt": null,
      "failureReason": null,
      "createdAt": "2026-...",
      "updatedAt": "2026-..."
    }
  ]
}
```

## Endpoints (Phase 10 — Recognition backend: points, badges, certificates)

All endpoints share the ops auth gate (`withOps` / `requireOps`): authenticated
session + at least one `public.memberships` row. Rows in other orgs map to
`NOT_FOUND`, never `FORBIDDEN`, to avoid existence leaks.

**No external side effects.** Every POST writes DB rows only. No notifications
are fired; no PDFs are rendered; no outbound delivery occurs. Donor counters
(`donors.total_points`) are updated via an explicit UPDATE after a ledger
append — without a transaction boundary (PostgREST constraint), because
recognition is best-effort and the ledger itself is the authoritative record.

### `GET /api/v1/ops/points-rules`

Lists points rules in the caller's org set, sorted by `rule_code`.

### `GET /api/v1/ops/points-rules/[id]`

Returns one rule. `NOT_FOUND` for foreign-org or missing ids.

### `GET /api/v1/ops/points-ledger`

All ledger entries across the caller's orgs, newest first by `awarded_at`.

### `GET /api/v1/ops/donors/[donorId]/points-ledger`

Ledger entries for one donor. Requires the donor be in the caller's orgs
(else `NOT_FOUND`).

### `POST /api/v1/ops/donors/[donorId]/points-awards`

Appends a ledger row and updates `donors.total_points`. Service-owned:

- `organization_id` = donor's org
- `balance_after` = `donor.total_points + points_delta`
- `ledger_type` — defaults to `"credit"` / `"debit"` from delta sign when omitted
- `awarded_at` — defaults to now when omitted
- `created_by` = acting user

Optional `rule_id` is validated: must be in the donor's org, active, and
inside its `start_at`/`end_at` window. If the rule has a non-null
`max_repeat_count`, prior ledger rows matching `(donor, rule)` are counted
and the award is rejected with `CONFLICT` if the cap has been reached.

**Body**

```jsonc
{
  "points_delta": 50,                       // required, non-zero integer

  "rule_id": "uuid",                         // optional, must be in donor's org
  "source_entity_type": "donation_request", // optional
  "source_entity_id": "uuid",                // optional
  "notes": "bonus for first pickup",         // optional
  "ledger_type": "credit",                   // optional override
  "awarded_at": "2026-..."                   // optional, ISO datetime
}
```

**201** returns the new ledger entry.

### `GET /api/v1/ops/badges`

Lists badges in the caller's orgs, ordered by `badge_level`.

### `GET /api/v1/ops/badges/[id]`

Returns one badge. `NOT_FOUND` for foreign-org or missing ids.

### `GET /api/v1/ops/donors/[donorId]/badges`

Lists badge awards held by the donor, newest first.

### `POST /api/v1/ops/donors/[donorId]/badge-awards`

Appends an award row. Enforces **one award per `(badge, donor)`** at the
app layer (CSV shows no DB unique constraint); a second attempt →
`CONFLICT`. `organization_id` derived from the donor. `awarded_by` =
acting user. `awarded_at` defaults to now when omitted.

**Body**

```jsonc
{
  "badge_id": "uuid",                        // required

  "award_reason": "Ramadan 1446 campaign",  // optional
  "award_source_entity_type": "sorting_session", // optional
  "award_source_entity_id": "uuid",          // optional
  "awarded_at": "2026-..."                   // optional, ISO datetime
}
```

**201** returns the new award.

### `GET /api/v1/ops/certificate-templates`

Lists templates in the caller's orgs, ordered by `template_code`.

### `GET /api/v1/ops/certificate-templates/[id]`

Returns one template. `NOT_FOUND` for foreign-org or missing ids.

### `GET /api/v1/ops/certificate-rules`

Lists rules in the caller's orgs, ordered by `rule_code`.

### `GET /api/v1/ops/certificate-rules/[id]`

Returns one rule.

### `GET /api/v1/ops/donors/[donorId]/issued-certificates`

Lists issued certificates for the donor, newest first by `created_at`.

### `POST /api/v1/ops/donors/[donorId]/issued-certificates`

Records issuance metadata. **No PDF rendering.** The service:

1. Verifies the template is in the donor's org and active.
2. If `certificate_rule_id` is supplied, verifies same-org, active, and
   that it points at the specified template.
3. If `pdf_attachment_id` is supplied, verifies the attachment belongs
   to the donor's org.
4. Generates `certificate_number` (`CERT-YYYYMMDD-<ts-base36>-<6-rand>`).
5. Generates `verification_code` (10-char base36 uppercase).
6. Sets `issue_status = "issued"` when a PDF attachment is present,
   else `"pending"` (a later phase's PDF pipeline will stamp
   `issued_at`, `issued_by`, and `pdf_attachment_id` and move status
   to `"issued"`).
7. Inserts the row. No dedupe guard — duplicate issuance is
   schema-permitted and treated as a later policy concern.

**Body**

```jsonc
{
  "certificate_template_id": "uuid",         // required

  "certificate_rule_id": "uuid",             // optional
  "source_entity_type": "donation_request",  // optional
  "source_entity_id": "uuid",                // optional
  "pdf_attachment_id": "uuid",               // optional, must be in donor's org
  "metadata_json": { "ramadan": true }       // optional, ≤128 keys
}
```

**201** returns the new issuance row.

## Endpoints (Phase 10 — Points, badges, and certificates backend, internal ops)

All endpoints share the ops auth gate (`withOps` / `requireOps`): authenticated
session + at least one `public.memberships` row. All seven recognition tables
are org-scoped via `organization_id`; donor-anchored POSTs verify the donor
belongs to one of the caller's orgs.

**Append-safety.** Ledger entries, badge awards, and issued certificates are
write-once. No UPDATE/DELETE is exposed in this phase. `donors.total_points`
is maintained by the service after each ledger insert as a best-effort
materialized counter; the ledger remains the source of truth for award events.

**No external side effects.** No notifications are sent, no PDFs are
rendered, no delivery providers are contacted. Certificates with no
`pdf_attachment_id` are recorded in `"pending"` status.

### `GET /api/v1/ops/points-rules`

Lists points rules in the caller's org set, ordered by `rule_code`.

### `GET /api/v1/ops/points-rules/[id]`

Returns one rule. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/points-ledger`

Lists ledger entries across the caller's org set, newest `awarded_at` first.

### `GET /api/v1/ops/donors/[donorId]/points-ledger`

Lists ledger entries for a specific donor. Donor must be in caller's orgs.

### `POST /api/v1/ops/donors/[donorId]/points-awards`

Appends a ledger entry for the donor. Writes only — no notifications.

Service flow:

1. Verify the donor is in the caller's orgs.
2. If `rule_id` is supplied: verify it belongs to the donor's org, is active,
   falls within its `start_at`/`end_at` window, and respects
   `max_repeat_count` (count prior ledger rows for `(donor_id, rule_id)`).
3. Compute `balance_after = donor.total_points + points_delta`.
4. Insert the ledger row. `ledger_type` defaults to `"credit"` (delta ≥ 0) or
   `"debit"` (delta < 0) when not supplied.
5. `UPDATE donors.total_points = balance_after`. Best-effort; no transaction.

**Body**

```jsonc
{
  "points_delta": 100,                         // required, non-zero int
  "rule_id": "uuid",                            // optional
  "source_entity_type": "donation_request",    // optional
  "source_entity_id": "uuid",                  // optional
  "notes": "manual award",                      // optional
  "ledger_type": "credit",                      // optional (server-derived)
  "awarded_at": "2026-..."                     // optional ISO datetime
}
```

**Failure modes:**

| Code | When |
|---|---|
| `NOT_FOUND` | Donor missing / foreign-org; rule missing or foreign-org |
| `BAD_REQUEST` | Rule inactive, not yet in effect, or expired |
| `CONFLICT` | Rule `max_repeat_count` reached for this donor |
| `VALIDATION_ERROR` | `points_delta` = 0 or unknown body keys |

**201** returns the created ledger entry.

### `GET /api/v1/ops/badges`

Lists badges in the caller's org set, ordered by `badge_level`.

### `GET /api/v1/ops/badges/[id]`

Returns one badge. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/donors/[donorId]/badges`

Lists badge awards for a donor, newest `awarded_at` first.

### `POST /api/v1/ops/donors/[donorId]/badge-awards`

Creates a badge award. Service verifies the donor belongs to the caller's
orgs, the badge belongs to the donor's org and is active, and no award
already exists for this `(badge, donor)` pair. `awarded_by` is the acting
user; `organization_id` is the donor's org.

**One-award-per-badge-per-donor is enforced at the application layer.**
No DB unique constraint is visible in the schema; a second POST for the same
pair returns `CONFLICT`.

**Body**

```jsonc
{
  "badge_id": "uuid",                          // required
  "award_reason": "First 10 donations",        // optional
  "award_source_entity_type": "donation_request", // optional
  "award_source_entity_id": "uuid",            // optional
  "awarded_at": "2026-..."                     // optional ISO datetime
}
```

**Failure modes:**

| Code | When |
|---|---|
| `NOT_FOUND` | Donor or badge missing / foreign-org |
| `BAD_REQUEST` | Badge is not active |
| `CONFLICT` | Badge already awarded to this donor |

**201** returns the created award.

### `GET /api/v1/ops/certificate-templates`

Lists certificate templates in the caller's org set.

### `GET /api/v1/ops/certificate-templates/[id]`

Returns one template.

### `GET /api/v1/ops/certificate-rules`

Lists certificate rules in the caller's org set.

### `GET /api/v1/ops/certificate-rules/[id]`

Returns one rule.

### `GET /api/v1/ops/donors/[donorId]/issued-certificates`

Lists certificates issued to a donor, newest first.

### `POST /api/v1/ops/donors/[donorId]/issued-certificates`

Issues a certificate. Writes the `issued_certificates` row only — no PDF
rendering is performed in this phase.

Service flow:

1. Verify the donor is in the caller's orgs.
2. Verify the `certificate_template_id` belongs to the donor's org and is
   active.
3. If `certificate_rule_id` is supplied: verify it belongs to the donor's
   org, its `certificate_template_id` matches the requested template, and
   it is active.
4. If `pdf_attachment_id` is supplied: verify the attachment belongs to the
   donor's org.
5. Generate `certificate_number` (server-side; format
   `CERT-YYYYMMDD-<ts-base36>-<6-rand>`) and `verification_code` (10-char
   uppercase base36).
6. `issue_status = "issued"` when a PDF attachment is supplied (with
   `issued_at = now()`, `issued_by = <actor>`); otherwise `"pending"`.

**No duplication guard is applied in this phase.** The schema permits
multiple issuances of the same template to the same donor; business intent
may vary (re-issues for corrections, re-prints, new tax years, etc.). If a
one-per-donor-per-template rule is needed later, add it as a dedicated
uniqueness constraint or service-layer predicate.

**Body**

```jsonc
{
  "certificate_template_id": "uuid",           // required
  "certificate_rule_id": "uuid",               // optional
  "source_entity_type": "donation_request",    // optional
  "source_entity_id": "uuid",                  // optional
  "pdf_attachment_id": "uuid",                 // optional
  "metadata_json": { "tax_year": 2025 }        // optional, ≤128 keys
}
```

**Failure modes:**

| Code | When |
|---|---|
| `NOT_FOUND` | Donor / template / rule / attachment missing or foreign-org |
| `BAD_REQUEST` | Template inactive; rule inactive; rule references a different template |
| `VALIDATION_ERROR` | Unknown body keys |

**201** returns the created issued-certificate row.

## Endpoints (Phase 11 — Legal, activity, audit backend, internal ops)

All endpoints share the ops auth gate (`withOps` / `requireOps`): authenticated
session + at least one `public.memberships` row. Rows in other orgs map to
`NOT_FOUND`, never `FORBIDDEN`, to avoid existence leaks.

**No external side effects.** The only write in this phase is the legal
acceptance POST — append-only, no notifications fired, no PDF rendering, no
outbound delivery. Activity logs and audit logs are read-only surface.

### `GET /api/v1/ops/legal-documents`

Lists legal documents in the caller's org set, newest first.

### `GET /api/v1/ops/legal-documents/[id]`

Returns one legal document. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/legal-acceptances`

Lists acceptances in the caller's org set, newest first by `accepted_at`.

### `GET /api/v1/ops/legal-acceptances/[id]`

Returns one acceptance. `NOT_FOUND` for missing or foreign-org ids.

### `POST /api/v1/ops/legal-acceptances`

Records an append-only acceptance. Service-owned fields:

- `organization_id` = document's org (never accepted from the body)
- `ip_address` = from `x-forwarded-for` (leftmost) or `x-real-ip` header
- `user_agent` = from the `user-agent` header, trimmed and capped at 1000 chars
- `accepted_at` = now (when omitted)
- `acceptance_text_snapshot` = document's `content_body` (when omitted —
  preserves exactly what was accepted; standard consent-law practice)

Actor rules (exactly one of `user_id` / `donor_id` required, Zod XOR):

- `user_id` — must equal the currently authenticated user id. Ops users
  may only record their own user-side acceptances; recording another
  internal user's acceptance is out of scope for this phase → `FORBIDDEN`.
- `donor_id` — must belong to the same org as the document → `NOT_FOUND`
  otherwise.

Effective-window guard: if the document has `effective_from` or
`effective_to` set and `now()` is outside the window → `BAD_REQUEST`.

**Body**

```jsonc
{
  "legal_document_id": "uuid",                 // required

  "user_id": "uuid",                            // exactly-one-of
  "donor_id": "uuid",                           //   user_id / donor_id

  "source_channel": "web",                     // optional
  "acceptance_text_snapshot": "...",           // optional — defaults to doc body
  "accepted_at": "2026-..."                    // optional, ISO datetime
}
```

**201** returns the created acceptance.

### `GET /api/v1/ops/activity-logs`

Lists activity log entries in the caller's org set, newest first by
`occurred_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "branchId": "uuid" /* or null */,
      "userId": "uuid" /* or null */,
      "actorType": "user",
      "entityType": "donation_request",
      "entityId": "uuid",
      "actionCode": "created",
      "actionLabel": "...",
      "description": "...",
      "sourceChannel": "web" /* or null */,
      "ipAddress": "..." /* or null */,
      "userAgent": "..." /* or null */,
      "metadataJson": { },
      "occurredAt": "2026-...",
      "createdAt": "2026-..."
    }
  ]
}
```

### `GET /api/v1/ops/activity-logs/[id]`

Returns one activity log entry.

### `GET /api/v1/ops/audit-logs`

Lists audit log entries in the caller's org set, newest first by
`occurred_at`.

**200** — same shape as activity logs, plus:
- `eventType`, `reasonRefId`
- `oldValuesJson`, `newValuesJson`, `diffJson` (JSONB change capture)
- `actorUserId` (vs `userId` on activity logs)

### `GET /api/v1/ops/audit-logs/[id]`

Returns one audit log entry.

## Endpoints (Phase 12 — Webhooks & integrations backend)

This phase provides two endpoint surfaces:

- **Ops endpoints** under `/api/v1/ops/...` — all use the standard
  ops auth gate (`withOps` / `requireOps`: authenticated session + at
  least one membership). Rows in other orgs map to `NOT_FOUND`, never
  `FORBIDDEN`, to avoid existence leaks.
- **Webhook receiver** under `/api/v1/webhooks/...` — **no auth**.
  Org is derived from the URL path segment via `provider_code` lookup.

**No external side effects.** The only writes in this phase are:

1. Configuration create/update via the ops endpoints.
2. Append-only `webhook_events` rows written by the receiver.

No notifications are sent. No HMAC/signature verification is performed
(schema does not provide a dedicated secret column; provider-specific
validation belongs to a later provider-execution phase). No downstream
business logic runs on webhook receipt — captured events are stored
with `processing_status = "pending"` for later processing.

### `GET /api/v1/ops/integration-providers`

Lists integration providers in the caller's org set, ordered by
`provider_code`.

### `GET /api/v1/ops/integration-providers/[id]`

Returns one provider. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/integration-configurations`

Lists configurations in the caller's org set, ordered by
`priority_order`. **Secret redaction**: top-level keys in
`config_payload_json` matching any of `secret`, `api_key`, `apikey`,
`token`, `password`, `private_key`, `client_secret`, `access_token`,
`refresh_token`, `webhook_secret`, `auth_token` (case-insensitive)
are returned as `"[REDACTED]"`. Nested structures are untouched —
the schema does not describe nested shapes. Writes accept the full
payload verbatim.

### `GET /api/v1/ops/integration-configurations/[id]`

Returns one configuration with the same secret-redaction rules.

### `POST /api/v1/ops/integration-configurations`

Creates a configuration. `organization_id` is NEVER accepted from the
body — it's derived from the referenced provider's `organization_id`,
eliminating cross-org spoofing entirely. Write defaults (for NOT-NULL
columns when the client omits them):

- `priority_order` → 0
- `is_default` → false
- `is_active` → true

**Body**

```jsonc
{
  "provider_id": "uuid",                   // required, must be in caller's orgs
  "config_name": "Twilio Saudi Arabia",    // required
  "config_payload_json": { "api_key": "...", "from": "..." }, // required, ≤256 keys

  "branch_id": "uuid",                     // optional
  "priority_order": 10,                    // optional, 0-10000
  "is_default": true,                       // optional
  "is_active": true                        // optional
}
```

**201** returns the stored configuration with secrets redacted.

### `PATCH /api/v1/ops/integration-configurations/[id]`

Sparse partial update. Non-patchable columns: `provider_id`,
`organization_id` (Zod schema omits them entirely — attempting either
raises `VALIDATION_ERROR`). At least one patchable field is required
otherwise `VALIDATION_ERROR`. `updated_by` is set from ctx.

**Body** (all optional; at least one required):

```jsonc
{
  "branch_id": "uuid",             // or null to clear
  "config_name": "...",
  "config_payload_json": { },       // replace entirely
  "priority_order": 5,
  "is_default": false,
  "is_active": true
}
```

**200** returns the updated configuration with secrets redacted.

### `GET /api/v1/ops/webhook-events`

Lists webhook events in the caller's org set, newest first by
`created_at`.

**200**

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "providerId": "uuid" /* or null */,
      "eventDirection": "inbound",
      "eventType": "message.delivered",
      "externalEventId": "evt_..." /* or null */,
      "requestHeadersJson": { /* sensitive auth headers redacted */ },
      "requestBodyJson": { },
      "responseBodyJson": { },
      "processingStatus": "pending",
      "processedAt": null,
      "errorMessage": null,
      "createdAt": "2026-..."
    }
  ]
}
```

### `GET /api/v1/ops/webhook-events/[id]`

Returns one webhook event. `NOT_FOUND` for missing or foreign-org ids.

### `GET /api/v1/ops/external-api-logs`

Lists external API logs in the caller's org set, newest first by
`executed_at`. **Read-only in this phase** — external-call logging
helpers are reserved for a later provider-execution layer.

### `GET /api/v1/ops/external-api-logs/[id]`

Returns one external API log entry.

### `POST /api/v1/webhooks/[providerKey]`

**Unauthenticated** webhook receiver. The path segment `[providerKey]`
is matched against `integration_providers.provider_code`.

Resolution rules:

- Zero active providers match → `404 NOT_FOUND`.
- Multiple active providers match (multi-tenant `provider_code`
  collision) → `409 CONFLICT`. Operators must use org-prefixed provider
  codes to make inbound URLs unambiguous.
- Exactly one active provider matches → proceed.

On success, the receiver:

1. Parses the raw body. JSON objects are stored verbatim; JSON
   scalars/arrays are wrapped as `{"_value": …}`; non-JSON text is
   wrapped as `{"_raw": "<first 1 000 000 chars>"}` — `request_body_json`
   is NOT NULL in DB.
2. Serializes request headers. Sensitive header values for
   `authorization`, `cookie`, `x-api-key`, `x-auth-token`,
   `x-webhook-secret` are stored as `"[REDACTED]"`.
3. Infers `event_type` from top-level body keys `event` / `event_type` /
   `eventType` / `type`; falls back to `"unknown"`.
4. Infers `external_event_id` from top-level body keys `id` / `event_id` /
   `eventId` / `external_id`; nullable.
5. Inserts an append-only `webhook_events` row with:
   - `event_direction = "inbound"`
   - `processing_status = "pending"`
   - `processed_at = null`, `error_message = null`
   - empty `response_body_json = {}`

**202** returns a minimal envelope — intentionally does NOT surface
the captured body or headers back to the caller (who may be an
untrusted third-party):

```jsonc
{
  "success": true,
  "data": { "id": "uuid", "accepted": true }
}
```

**No HMAC / signature verification is performed in this phase.** A
later phase's provider-execution layer can:

- Read pending events from `webhook_events`.
- Resolve the relevant `integration_configurations` row by
  `(organization_id, provider_id, is_active = true)` ordered by
  `priority_order`.
- Validate signatures using provider-specific logic and fields inside
  `config_payload_json`.
- Flip `processing_status` to `"processed"` or `"failed"` and stamp
  `processed_at` / `error_message` accordingly.
