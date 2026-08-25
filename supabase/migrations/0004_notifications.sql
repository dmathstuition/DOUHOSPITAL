-- ============================================================================
-- DOUHC — 0004 Notification & SMS-campaign tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- notifications — the queue that Google Apps Script drains.
-- dedupe_key enforces idempotency (a job may run twice).
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid references public.patients(id) on delete set null,
  appointment_id      uuid references public.appointments(id) on delete set null,
  channel             public.notification_channel not null,
  notification_type   text not null default 'generic',
  recipient           text not null,
  subject             text,
  message             text,
  status              public.notification_status not null default 'pending',
  provider            text,
  provider_message_id text,
  scheduled_at        timestamptz not null default now(),
  sent_at             timestamptz,
  retry_count         integer not null default 0,
  error_message       text,
  dedupe_key          text,
  payload             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- Idempotency: at most one notification per logical dedupe key.
create unique index if not exists uq_notifications_dedupe
  on public.notifications (dedupe_key) where dedupe_key is not null;

-- The engine claims due, pending work with this index.
create index if not exists idx_notifications_due
  on public.notifications (status, scheduled_at)
  where status in ('pending', 'processing');
create index if not exists idx_notifications_patient on public.notifications (patient_id);

-- ---------------------------------------------------------------------------
-- notification_templates
-- ---------------------------------------------------------------------------
create table if not exists public.notification_templates (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  channel    public.notification_channel not null,
  subject    text,
  body       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_templates_updated
  before update on public.notification_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notification_logs — immutable delivery attempts / audit of sending.
-- ---------------------------------------------------------------------------
create table if not exists public.notification_logs (
  id                  uuid primary key default gen_random_uuid(),
  notification_id     uuid references public.notifications(id) on delete cascade,
  attempt             integer not null default 1,
  status              public.notification_status not null,
  provider            text,
  provider_message_id text,
  response            jsonb,
  error_message       text,
  created_at          timestamptz not null default now()
);
create index if not exists idx_notiflogs_notification
  on public.notification_logs (notification_id, created_at);

-- ---------------------------------------------------------------------------
-- sms_campaigns & recipients
-- ---------------------------------------------------------------------------
create table if not exists public.sms_campaigns (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  message         text not null,
  filters         jsonb not null default '{}'::jsonb,
  recipient_count integer not null default 0,
  status          public.notification_status not null default 'pending',
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_campaigns_updated
  before update on public.sms_campaigns
  for each row execute function public.set_updated_at();

create table if not exists public.sms_campaign_recipients (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.sms_campaigns(id) on delete cascade,
  patient_id          uuid references public.patients(id) on delete set null,
  phone               text not null,
  status              public.notification_status not null default 'pending',
  provider_message_id text,
  error_message       text,
  created_at          timestamptz not null default now()
);
create index if not exists idx_campaign_recipients on public.sms_campaign_recipients (campaign_id);
