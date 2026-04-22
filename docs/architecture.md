# Architecture

## Purpose

Foundation of a modular SaaS-style operational platform for managing in-kind
donation intake and logistics in Saudi Arabia.

## Current scope

Only Phase 1 (Foundation) and Phase 2 (Auth / Current User Context) are
implemented. Feature modules are intentionally deferred.

## Stack

- **Framework**: Next.js 15, App Router
- **Language**: TypeScript (strict, `noUncheckedIndexedAccess`)
- **Backend**: Route Handlers under `app/api/v1/...`
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Package manager**: pnpm
- **Deploy**: Vercel (Cloudflare in front)

## Layering

```
app/api/v1/...       -> thin route handlers
src/services/...     -> business use cases / orchestration
src/repositories/... -> DB access (Supabase) only
src/domain/...       -> pure business rules / transitions / validation rules
src/lib/...          -> shared helpers (supabase, auth, http, errors, logging, validation, permissions)
src/modules/...      -> per-module DTOs, schemas, types, constants, policies
docs/...             -> implementation notes + API docs
```

Dependencies flow in one direction:

```
app/api  ->  services  ->  repositories
                \          /
                 \-> domain <-/
                      |
                     lib (cross-cutting)
```

Route handlers never import repositories directly. Services never call
Supabase directly. The domain layer never imports from `lib/supabase` or
Next.js — it works on already-fetched values.

## API style

- REST under `/api/v1/...`
- Handlers are thin — a few lines at most
- Business logic in services; DB work in repositories
- Write endpoints parse bodies through `parseJsonBody(req, schema)` from
  `@lib/validation`
- Every response uses `ok()` / `fail()` / `failFromError()` from
  `@lib/http/response`

## Response envelope

```jsonc
// success
{ "success": true, "data": { /* ... */ } }

// error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "path": "email", "message": "Invalid email" }]
  }
}
```

`details` is optional and currently only attached for validation errors.

## Supabase clients

Three clients, each with a clear purpose — do not mix them up.

| Client          | File                           | Use from                                  | Honors RLS |
| --------------- | ------------------------------ | ----------------------------------------- | ---------- |
| Browser         | `src/lib/supabase/browser.ts`  | Client components                         | Yes        |
| Server          | `src/lib/supabase/server.ts`   | Route handlers, server components, actions | Yes        |
| Service-role    | `src/lib/supabase/service-role.ts` | Server-only, sparingly, after explicit authz | **No** — elevated |

The service-role module is guarded by `import "server-only"`. Importing it
from a client component fails the build.

## Non-negotiables

- No SQL in pages or components.
- No business logic in React pages.
- Sensitive operations go through `/api/v1/...`.
- Service-role key is server-only. Never `NEXT_PUBLIC_`.
- Do not redesign the DB or rename tables/columns.
- Do not hardcode workflow / approval / points / badge / certificate logic if
  DB-driven tables exist for them.
- Do not create unrelated demo code.

## Testing the foundation

Start the dev server with valid Supabase env, then:

```bash
curl -s http://localhost:3000/api/v1/health | jq
# { "success": true, "data": { "status": "ok", ... } }

curl -s http://localhost:3000/api/v1/me | jq
# { "success": false, "error": { "code": "UNAUTHENTICATED", ... } }
```

With an authenticated session (cookies set by a prior sign-in), `/api/v1/me`
returns the resolved context:

```jsonc
{
  "success": true,
  "data": {
    "user": { "id": "...", "authUserId": "..." },
    "donor": { "id": "..." } | null,
    "courier": { "id": "..." } | null,
    "memberships": [
      {
        "id": "...",
        "organizationId": "...",
        "branchId": "..." | null,
        "roles": [{ "id": "...", "code": "admin" }]
      }
    ]
  }
}
```
