/**
 * Minimal landing page.
 *
 * This project is backend-first. The UI layer sits outside the backend
 * scope. This page exists only so the app renders something on `/`.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Rafd
        </p>
        <h1 className="mt-1 text-3xl font-semibold">API foundation</h1>
        <p className="mt-4 text-slate-600">
          Phases 1–12 are implemented: project foundation, authentication
          context, donor backend, donor requests / pickup logistics, courier
          &amp; field operations, the internal sorting backend, the internal
          approvals backend, the internal workflow backend, the internal
          templates &amp; notifications backend, the internal recognition
          backend (points, badges, certificates), the internal legal,
          activity, and audit backend, and the internal webhooks &amp;
          integrations backend including a public webhook receiver for
          inbound provider events. This completes the backend scope.
          Frontend, provider execution, background job orchestration, and
          deployment automation sit outside this repository.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900">Smoke tests</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              GET /api/v1/health
            </code>{" "}
            — unauthenticated liveness
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              GET /api/v1/me
            </code>{" "}
            — requires an authenticated Supabase session
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              GET /api/v1/donor/*
            </code>{" "}
            — requires an authenticated donor (see docs/api.md)
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              GET /api/v1/courier/*
            </code>{" "}
            — requires an authenticated courier (see docs/api.md)
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
              GET /api/v1/ops/*
            </code>{" "}
            — internal ops, requires ≥1 membership (see docs/api.md)
          </li>
        </ul>
      </div>
    </main>
  );
}
