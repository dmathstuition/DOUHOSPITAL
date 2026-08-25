# DOUHC — Production Readiness (Phase 10)

A pre-deployment review of security, access control, performance, accessibility
and operations. Items marked **Action** must be completed by the institution
before go-live.

## Security

- [x] **HTTP security headers** — CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  (`next.config.mjs`).
- [x] **RLS enabled on every table** with least-privilege policies
  (`supabase/migrations/0006`, `0011`). Automation uses the service role, which
  bypasses RLS; no permissive policies are exposed for it.
- [x] **Secrets server-side only** — `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
  never reach the browser; `createAdminClient()` throws if imported client-side.
  Termii keys live only in Apps Script.
- [x] **Self-signup cannot grant staff roles** — `handle_new_user` forces
  `patient`; staff accounts are created by an admin (service role) with the role
  set server-side.
- [x] **Input validation** — Zod on every form, on both client and server; DB
  constraints enforce invariants regardless of caller.
- [x] **File uploads** — MIME/extension/size validated; medical files in private
  buckets, served only via short-lived signed URLs.
- [x] **Bulk SMS / registration** — server-side authorization + best-effort rate
  limiting; campaigns and exports are audited.
- [ ] **Action** — set a strong `CRON_SECRET` and rotate the service-role key on
  a schedule.
- [ ] **Action** — for strict global rate limiting, back `lib/security/rate-limit`
  with a shared store (e.g. Upstash Redis). Current limiter is per-instance.
- [ ] **Action** — run `npm audit` and patch transitive advisories; review before
  each release.

## Authorization (verified by design)

| Surface | Gate |
| --- | --- |
| Staff dashboard | middleware + `getCurrentUser` + `isStaff` + RLS |
| Admin-only pages (users, settings, SMS, audit, reports) | `can(role, …)` + RLS |
| Patient records | staff read; clinical notes staff-only; RLS |
| Doctor worklist / visit actions | ownership check (assigned doctor) + RLS |
| Public register / info pages | open; submissions server-validated + rate-limited |

## Performance

- [x] Server Components by default; head-count queries for stats (no row bodies).
- [x] Pagination on patients, audit; bounded report/SMS queries.
- [x] Indexes on all common filters/joins (see `docs/database.md`).
- [ ] **Action** — load-test appointment booking under concurrency (the unique
  index already prevents double-booking; confirm latency).

## Accessibility

- [x] Semantic landmarks, `lang="en"`, skip-to-content link, labelled inputs,
  visible focus rings, `aria-current` on active nav.
- [ ] **Action** — run an automated audit (axe/Lighthouse) on key flows and a
  screen-reader spot check.

## Mobile

- [x] Responsive layouts; tables scroll within their container; mobile sidebar
  drawer; staff workflows usable on phones.
- [ ] **Action** — device test the nurse/doctor/reception flows on iOS + Android.

## Operations

- [x] **CI** — typecheck, lint, tests, build on every push/PR
  (`.github/workflows/ci.yml`).
- [x] Migrations are idempotent and re-runnable (`docs/database.md`).
- [ ] **Action** — configure Supabase automated backups + PITR; verify a restore.
- [ ] **Action** — deploy the Apps Script engine, set Script Properties, run
  `installTriggers()`; confirm reminders/follow-ups fire.

## Privacy / legal

- [x] Privacy notice and terms pages; data minimization; audit trail; controlled
  export (clinical notes excluded from ordinary exports).
- [ ] **Action** — complete the institution's legal/privacy review (e.g. NDPR)
  before processing real patient data. Technical controls are not a compliance
  claim.
