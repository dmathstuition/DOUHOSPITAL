# DOUHC — Dennis Osadebay University Health Center

A university health-center management platform: public website, patient portal
and secure staff/admin dashboard. Built with Next.js + Supabase, with a Google
Apps Script + Termii automation layer for SMS/email.

> Not a landing page — a healthcare management system. See the phased build
> status below.

## Stack

- **Frontend:** Next.js (App Router) · TypeScript (strict) · Tailwind · shadcn-style UI · Lucide · React Hook Form · Zod · Recharts
- **Backend:** Supabase — PostgreSQL · Auth · Storage · Row Level Security
- **Automation:** Google Apps Script (email + Termii SMS orchestration)
- **SMS:** Termii (Nigeria) · **Hosting:** Vercel

## Architecture

```
Next.js ──▶ Supabase (Postgres · Auth · Storage · RLS)  ← source of truth
                         │
                         ▼
              Google Apps Script (automation layer)
                ├─ Email (MailApp; Resend-ready later)
                ├─ Termii SMS
                ├─ Appointment reminders (24h)
                └─ Follow-ups (2 days)
```

Notifications go through a **provider-independent `NotificationService`**
(`src/lib/notifications/`) so email can later move to Resend without touching
the appointment system.

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in Supabase keys
# apply supabase/migrations 0001..0009 to your project
npm run dev
```

Full instructions: [`docs/setup.md`](docs/setup.md).

## Documentation

- [Setup](docs/setup.md) · [Database](docs/database.md) · [Google Apps Script](docs/google-apps-script.md)
- [Termii](docs/termii.md) · [Security](docs/security.md) · [Deployment](docs/deployment.md)

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # strict TS
npm run lint       # ESLint
npm run test       # unit tests
```

## Build status by phase

| Phase | Area | Status |
| --- | --- | --- |
| 1 | Foundation: Next.js, auth, public site, branding, dashboard shell | ✅ Complete |
| 2 | Database: schema, migrations, constraints, RLS, audit | ✅ Complete |
| 8 (infra) | Google Apps Script + Termii engine, notification service | ✅ Complete |
| 3 | Patient management (registration, search, profile, vitals) | ✅ Core complete |
| 4 | Doctors & departments admin (CRUD + weekly schedules) | ✅ Complete |
| 5 | Appointments (booking wizard, slot generation, day board, check-in) | ✅ Complete |
| 6 | Waiting queue | ⏳ Planned |
| 7 | Clinical modules (consultations, lab, pharmacy) | ⏳ Planned |
| 9 | Dashboard analytics, reports, bulk SMS, exports | ⏳ Planned |
| 10 | Security/perf/a11y hardening & production review | ⏳ Planned |

Phase status is tracked honestly — planned modules render a clear
"module is being set up" state rather than faking functionality.

## Security notes

Service-role keys, `CRON_SECRET`, and Termii keys are never exposed to the
browser. RLS is enabled on every table. See [`docs/security.md`](docs/security.md).
Technical controls are not a legal-compliance claim; the institution should
complete a privacy/legal review before production use.
