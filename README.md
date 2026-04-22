# Rafd — Operational Platform (Foundation)

Production-oriented cloud-first platform for managing in-kind donation intake and
logistics in Saudi Arabia.

This repository currently contains the complete backend foundation across
twelve phases: **Phase 1 (Foundation)**, **Phase 2 (Auth / Current User
Context)**, **Phase 3 (Donor Backend)**, **Phase 4 (Donor requests &
pickup logistics)**, **Phase 5 (Courier & field operations)**, **Phase 6
(Sorting backend — internal ops)**, **Phase 7 (Approvals backend —
internal ops)**, **Phase 8 (Workflow backend — internal ops)**, **Phase 9
(Templates & notifications backend — internal ops)**, **Phase 10
(Recognition backend: points, badges, certificates — internal ops)**,
**Phase 11 (Legal, activity, audit backend — internal ops)**, and
**Phase 12 (Webhooks & integrations backend — internal ops + public
webhook receiver)**. This completes the backend scope.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Backend**: Route Handlers under `/app/api/v1/...`
- **Database / Auth / Storage**: Supabase
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Package manager**: pnpm
- **Deploy**: Vercel (behind Cloudflare)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in real Supabase values
pnpm dev
```

Visit:

- `http://localhost:3000/` — landing page stub
- `http://localhost:3000/api/v1/health` — health endpoint (Phase 1 smoke test)
- `http://localhost:3000/api/v1/me` — current user context (Phase 2, requires auth)
- `http://localhost:3000/api/v1/donor/*` — donor backend (Phases 3–4, requires an authenticated donor)
- `http://localhost:3000/api/v1/courier/*` — courier & field ops (Phase 5, requires an authenticated courier)
- `http://localhost:3000/api/v1/ops/*` — internal sorting backend (Phase 6, requires an authenticated user with at least one membership)

## Architecture

Strict layering — see [`docs/architecture.md`](./docs/architecture.md).

```
app/api/v1/...       -> thin route handlers
src/services/...     -> business use cases
src/repositories/... -> DB access (Supabase) only
src/domain/...       -> pure business rules / transitions / validation rules
src/lib/...          -> shared helpers (supabase, auth, http, errors, logging, validation, permissions)
src/modules/...      -> per-module DTOs, schemas, types, constants, policies
docs/...             -> implementation notes + API docs
```

**Non-negotiables** (see architecture doc for full list):

- No SQL in pages or components.
- No business logic in React pages.
- Sensitive operations go through `/api/v1/...` handlers.
- Service-role Supabase key is **server-only**. Never `NEXT_PUBLIC_`.

## Response envelope

All API responses follow this shape:

```jsonc
// success
{ "success": true, "data": { /* ... */ } }

// error
{ "success": false, "error": { "code": "SOME_CODE", "message": "Human readable" } }
```

Use `ok()` / `fail()` from `@lib/http/response`.

## Database

The Supabase schema is owned externally and must not be redesigned from this repo.
To generate types locally (recommended):

```bash
npx supabase gen types typescript --project-id <your-project-ref> --schema public \
  > src/lib/supabase/database.types.ts
```

A placeholder `database.types.ts` ships with this scaffold — replace it with the
generated output. See [`docs/database.md`](./docs/database.md).

## Scripts

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Start the Next.js dev server                     |
| `pnpm build`       | Production build                                 |
| `pnpm start`       | Start the production server                     |
| `pnpm lint`        | Run ESLint                                       |
| `pnpm type-check`  | Run `tsc --noEmit`                               |

## Post-backend scope (not implemented here)

This repository covers backend-only concerns. The following layers sit
beyond the backend scope and are intentionally not part of this codebase:

- Frontend / UI — donor portal, courier field app, internal ops console.
- Provider execution engine — actually sending SMS / email / WhatsApp
  messages, rendering certificate PDFs, processing pending webhook
  events into downstream business actions, and recording outbound
  calls to `external_api_logs`.
- Background job orchestration — scheduler, retry queues, dead-letter
  handling for webhook processing.
- Deployment automation — CI/CD pipelines, infrastructure as code.
- Analytics dashboards — admin reporting surfaces.

The backend provides the complete data surface these layers will
consume: append-only logs for auditing, read-only inspection endpoints,
write endpoints for configuration + business data, and an inbound
webhook capture endpoint that records events for later async
processing.
