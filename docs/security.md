# DOUHC — Security

This platform processes sensitive personal and health information. Security is
layered; the frontend is never trusted.

## Authentication & authorization

- **Supabase Auth** (email/password) with session refresh in middleware.
- **Roles** (`super_admin`, `doctor`, `nurse`, `receptionist`, `patient`) stored
  in `profiles.role` — read **server-side**, never from client metadata.
- Self-signup can only ever create a `patient`; staff roles are assigned by an
  admin (enforced in `handle_new_user()`).
- **RBAC** for UI gating (`src/lib/rbac.ts`) is always backed by server checks
  and RLS.

## Row Level Security

- Enabled on **every** table (`0006_rls_policies.sql`).
- Patients reach only their own records; clinical notes are staff-only.
- No broad/unrestricted policies on sensitive tables.
- The service-role key is used only server-side (Apps Script, trusted server
  actions) and is never shipped to the browser.

## Secrets

Never exposed to client JavaScript:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `TERMII_API_KEY` (lives only in Apps Script Script Properties)

## Transport & headers

- HTTPS everywhere; a **Content-Security-Policy** plus HSTS,
  `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, and a
  restrictive `Permissions-Policy` set in `next.config.mjs`.

## Public registration & rate limiting

- The public `/register` form creates a **registration request**, not an
  account — patients never log in. Submissions are validated server-side and
  stored via the service role (no anonymous table access); staff review and
  create the patient record.
- Abuse-prone public actions use a best-effort rate limiter
  (`lib/security/rate-limit`). On serverless this is per-instance; back it with a
  shared store for strict global limits.

## Files

- Medical documents in **private** Storage buckets, served only via short-lived
  signed URLs.
- Uploads validated for MIME type, extension and size; executables rejected.

## Audit

- Append-only `audit_logs` (update/delete blocked by trigger).
- Write triggers on patients, medical records, prescriptions, lab results and
  appointments. Emergency access is auditable.

## Validation

- **Zod** schemas on client and server (`src/lib/validation/`).
- DB constraints enforce invariants regardless of the caller.

## Input handling

- React escapes output by default (XSS); parameterized PostgREST/SQL avoids
  injection; server actions re-validate all input.

## Not a compliance claim

Technical controls do not by themselves constitute legal compliance. The
institution must complete the appropriate legal/privacy review (e.g. NDPR)
before production deployment.
