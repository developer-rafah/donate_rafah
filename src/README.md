# `src/` — source layout

Strict layering. Read from top to bottom; dependencies only flow downward.

| Layer            | Purpose                                                          | Allowed to import from              |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------- |
| `services/`      | Business use cases / orchestration                               | `domain`, `repositories`, `modules`, `lib` |
| `repositories/`  | DB access (Supabase). No business rules.                         | `lib/supabase`, `lib/errors`, `lib/auth/types` |
| `domain/`        | Pure business rules, transitions, validation rules (framework-free) | other `domain` modules, types only |
| `modules/`       | Per-module DTOs, Zod schemas, constants, policies                | `domain`, `lib` (types only)        |
| `lib/`           | Cross-cutting helpers (supabase clients, auth, http, errors, logging, validation, permissions) | Only other `lib/` submodules        |

Route handlers live in `../app/api/v1/...` and must stay thin — import a
service, call it, return `ok()` / let errors bubble to `withErrorHandling`.

Phase 1 and Phase 2 only. Phase 3+ modules (donations, pickups, field
operations, sorting, approvals, workflows, templates, notifications, points,
certificates, logs, integrations) are not implemented yet and must not be
added here until explicitly scoped in.
