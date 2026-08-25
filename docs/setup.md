# DOUHC — Local Setup

Dennis Osadebay University Health Center (DOUHC) management platform.

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- (For SMS/email automation) A Google account for Google Apps Script and a
  Termii account for Nigerian SMS

## 1. Install

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **Secret** — never sent to the browser |
| `CRON_SECRET` | server ↔ Apps Script | Shared secret |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | links/redirects | e.g. `http://localhost:3000` |

> Termii credentials are **not** set here — they live in Google Apps Script.
> See `docs/termii.md` and `docs/google-apps-script.md`.

## 2. Database

Apply the migrations in `supabase/migrations` in order. Options:

- **Supabase CLI** (recommended): `supabase link` then `supabase db push`
- **Dashboard**: paste each file (0001 → 0009) into the SQL editor and run in order

See `docs/database.md` for details on schema, RLS and seed data.

## 3. Create the first Super Admin

Self-signup always creates a `patient` (enforced in the DB — user metadata can
never grant staff roles). Elevate your own account once:

```sql
update public.profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'you@dou.edu.ng');
```

## 4. Run

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # strict TypeScript
npm run lint
npm run test       # unit tests (phone utils, etc.)
npm run build      # production build
```

## 5. Automation (optional but recommended)

Set up the Google Apps Script "DOUHC Notification Engine" for SMS/email
reminders and follow-ups — see `docs/google-apps-script.md`.

## 6. Deploy

See `docs/deployment.md` (Vercel).
