# Authentication and current-user context (Phase 2)

## Flow

1. Supabase Auth issues a session to the browser client.
2. Middleware (`middleware.ts`) refreshes the session cookies on every
   request using `@supabase/ssr`.
3. Server-side code reads cookies via `createSupabaseServerClient()`.
4. `getCurrentContext()` resolves the authenticated caller into a richer
   `CurrentUserContext`:

```
auth.uid()
  |
  v
public.users (by auth_user_id)
  |-- donors      (by user_id)
  |-- couriers    (by user_id)
  |-- memberships (by user_id)
         |
         |-- membership_roles -> roles
```

## Protecting a route

Three equivalent patterns — pick the smallest that fits.

### `withAuthHandler` — auth + error envelope in one line

```ts
import { ok } from "@lib/http/response";
import { withAuthHandler } from "@lib/auth";

export const GET = withAuthHandler(async (_req, ctx) => {
  return ok({ userId: ctx.user.id });
});
```

### `withAuth` + `withErrorHandling` — compose manually

```ts
import { ok, withErrorHandling } from "@lib/http/response";
import { withAuth } from "@lib/auth";

export const GET = withErrorHandling(
  withAuth(async (_req, ctx) => ok({ userId: ctx.user.id }))
);
```

### `requireUser()` — imperative

```ts
import { ok, withErrorHandling } from "@lib/http/response";
import { requireUser } from "@lib/auth";

export const GET = withErrorHandling(async () => {
  const ctx = await requireUser();
  return ok({ userId: ctx.user.id });
});
```

## Resolving specific roles of the same user

Granular accessors exist when a caller only needs one slice:

```ts
import {
  getCurrentUser,
  getCurrentDonor,
  getCurrentCourier,
  getCurrentMemberships,
} from "@lib/auth";
```

All of them return `null` / `[]` for unauthenticated callers without
throwing, so they can be used in optional-auth flows.

## Assumptions about the schema

The repositories in `src/repositories/{users,donors,couriers,memberships}/`
make the following assumptions. Each file has `ASSUMPTION:` comments in case
a column name differs:

- `public.users(id, auth_user_id)` — `auth_user_id` maps to `auth.uid()`.
- `public.donors(id, user_id)` — optional per user.
- `public.couriers(id, user_id)` — optional per user.
- `public.memberships(id, user_id, organization_id, branch_id)`.
- `public.membership_roles(membership_id, role_id)`.
- `public.roles(id, code)` — `code` is the stable machine identifier used by
  permission checks. Any human-facing display label lives elsewhere and
  must not be used for authorization.

When generated types are in place (`database.types.ts`), update the explicit
`select(...)` lists and casts; no other layer should need changes.

## Permissions

`src/lib/permissions/index.ts` is a skeleton. `hasPermission` currently
returns `false` so accidental early use fails closed. The real
implementation will resolve `role_permissions -> permissions` once the
catalog is finalized. Until then, use `hasRole(ctx, "admin")` — matching
against the stable `roles.code` — only when gating is genuinely role-based
and temporary.
