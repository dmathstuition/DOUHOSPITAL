# DOUHC — Deployment (Vercel)

## 1. Prepare

- Supabase project created and migrations applied (`docs/database.md`).
- Google Apps Script engine configured (`docs/google-apps-script.md`).

## 2. Import to Vercel

Connect the Git repository and import the project (framework: **Next.js**,
detected automatically).

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Name | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production/Preview | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production/Preview | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Production/Preview | **Secret** |
| `CRON_SECRET` | Production/Preview | **Secret**, matches Apps Script |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | Production/Preview | e.g. `https://douhc.vercel.app` |

Do **not** add Termii variables to Vercel — they belong to Apps Script.

## 4. Supabase Auth redirect URLs

Add your Vercel URL(s) to Supabase → Authentication → URL Configuration:

- Site URL: `https://<your-app>.vercel.app`
- Redirect: `https://<your-app>.vercel.app/auth/callback`

## 5. Build

Vercel runs `npm run build`. Confirm locally first:

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

## 6. Post-deploy checks

- Public pages render; hero/logo placeholders visible.
- Registration → email confirmation → login works.
- Staff dashboard gated correctly by role.
- Apps Script `healthCheck()` reaches Supabase; `installTriggers()` scheduled.
