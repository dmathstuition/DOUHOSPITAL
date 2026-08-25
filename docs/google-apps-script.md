# DOUHC — Google Apps Script Notification Engine

The automation/notification layer. **Supabase is the source of truth**; Apps
Script only reads pending work and delivers it (Termii SMS, MailApp email).

## Files (`google-apps-script/`)

| File | Responsibility |
| --- | --- |
| `Config.gs` | Reads secrets from Script Properties |
| `Supabase.gs` | PostgREST client (service role) |
| `Termii.gs` | SMS via Termii (mock+log when not configured) |
| `Email.gs` | Email via MailApp |
| `Appointments.gs` | Appointment query/formatting helpers |
| `Notifications.gs` | Drains the `notifications` queue (idempotent) |
| `Reminders.gs` | Appointment reminders at 2 days AND 1 day before (once each) |
| `FollowUps.gs` | 2-day post-visit follow-ups (once per visit) |
| `Logs.gs` | Writes `notification_logs` |
| `Code.gs` | Entry points, trigger installer, secured webhook |

## Setup

1. Create a new Apps Script project named **DOUHC Notification Engine**.
2. Add each `.gs` file (and `appsscript.json`) with matching names.
3. Set **Script Properties** (Project Settings → Script properties):

   ```
   SUPABASE_URL               = https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY  = <service role key>   ← secret
   TERMII_API_KEY             = <termii key>
   TERMII_BASE_URL            = https://api.ng.termii.com
   TERMII_SENDER_ID           = DOUHC
   DOUHC_EMAIL                = healthcenter@dou.edu.ng
   CRON_SECRET                = <same value as the web app>
   ```

4. Run `healthCheck()` once and grant the requested OAuth scopes.
5. Run `installTriggers()` to schedule:
   - `processNotificationQueue` — every 15 minutes
   - `processAppointmentReminders` — daily 07:00
   - `processFollowUps` — daily 09:00

## Idempotency (critical)

- The queue processor **claims** a row by flipping `pending → processing`
  matching on the current status; only the run that wins the PATCH sends it.
- Reminders/follow-ups insert notifications with a **`dedupe_key`**
  (`reminder:<id>`, `followup:<id>`) protected by a unique index, and flag the
  appointment (`reminder_sent` / `follow_up_sent`). A trigger firing twice
  never double-sends.

## Optional immediate processing

The web app can `POST` to the deployed Web App URL with
`{ "secret": "<CRON_SECRET>" }` to process the queue immediately after a
booking. Requests without the correct secret are rejected — this is **not** an
open SMS endpoint.

## Security

- Secrets live only in Script Properties (`PropertiesService`), never in source.
- The service-role key is never exposed to any browser.
- If Termii is unconfigured, SMS is **logged, not sent**, and the notification
  is not marked delivered.
