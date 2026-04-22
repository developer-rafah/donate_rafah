# Database

## Ownership

The Supabase PostgreSQL schema is owned **externally**. This repository
does not define, migrate, or mutate it. Do not add SQL migrations here.

The repository consumes the schema as a contract:

- Core / identity: organizations, branches, settings, reference_lists,
  reference_values, users, profiles, memberships, roles, permissions,
  role_permissions, membership_roles
- Donors & requests: donors, donor_contact_details,
  donor_profile_update_requests, pickup_locations, schedule_slots,
  request_statuses, donation_requests, donation_request_details,
  donation_request_status_history, bookings, attachments
- Field operations & sorting: field_task_statuses, assignment_statuses,
  couriers, courier_availability, courier_coverage_areas,
  courier_status_logs, field_tasks, assignments, field_updates,
  field_proofs, intake_records, item_classifications,
  item_condition_assessments, sorting_decisions, sorting_sessions,
  sorted_items, estimated_values, sorting_decision_logs,
  sorting_review_tasks
- Approvals & workflows: approval_types, approval_chains,
  approval_chain_steps, approval_requests, approval_decisions,
  workflow_templates, workflow_steps, workflow_transition_rules,
  workflow_instances, workflow_step_instances, automation_actions,
  workflow_action_logs
- Templates & notifications: template_types, templates, template_versions,
  template_variables, notifications, notification_recipients,
  communication_campaigns, campaign_deliveries
- Points / badges / certificates: points_rules, points_ledger, badges,
  badge_awards, certificate_templates, certificate_rules,
  issued_certificates
- Logs / integrations / legal: activity_logs, audit_logs,
  integration_providers, integration_configurations, webhook_events,
  external_api_logs, legal_documents, legal_acceptances

## Generating types

Replace the placeholder `src/lib/supabase/database.types.ts` with output from
the Supabase CLI:

```bash
npx supabase login
npx supabase gen types typescript \
  --project-id <your-project-ref> \
  --schema public \
  > src/lib/supabase/database.types.ts
```

Once generated, the clients (`createSupabaseServerClient`, etc.) are already
parameterized with `Database` and the repositories will light up with real
row types.

## Repository rules

- No `select('*')` — always list columns explicitly.
- No business logic in repository files. They read and return.
- Writes are server-side only, behind a service, behind an API handler.
- Respect RLS: use the cookie-bound server client by default. Reach for
  the service-role client only when a specific authorization decision has
  already been made in the service layer.
- For polymorphic tables (`attachments`, `activity_logs`, `audit_logs`,
  `webhook_events`, etc.), encapsulate access behind typed service
  functions — never expose raw polymorphic reads to the API layer.

## Auth mapping

- `public.users.auth_user_id` = `auth.uid()` — this is the join used by
  `findUserByAuthId`.
- `public.donors.user_id` → `public.users.id`.
- `public.couriers.user_id` → `public.users.id`.
- `public.memberships.user_id` → `public.users.id`.

If any of these join columns differ in the real schema, update only the
corresponding file in `src/repositories/`.
