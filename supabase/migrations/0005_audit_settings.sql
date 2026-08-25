-- ============================================================================
-- DOUHC — 0005 Audit log & system settings
-- ============================================================================

-- ---------------------------------------------------------------------------
-- audit_logs — append-only trail. No UPDATE/DELETE policies are ever granted
-- to ordinary users; see 0006 RLS.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete set null,
  actor_role    public.user_role,
  action        text not null,
  resource      text,
  resource_id   text,
  ip_address    inet,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_audit_user on public.audit_logs (user_id, created_at desc);
create index if not exists idx_audit_action on public.audit_logs (action, created_at desc);
create index if not exists idx_audit_resource on public.audit_logs (resource, resource_id);

-- Block updates/deletes at the table level (defence in depth beyond RLS).
create or replace function public.audit_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs is append-only';
end $$;

drop trigger if exists trg_audit_no_update on public.audit_logs;
create trigger trg_audit_no_update
  before update or delete on public.audit_logs
  for each row execute function public.audit_immutable();

-- Convenience writer used by app server code / other triggers.
create or replace function public.write_audit(
  p_action text,
  p_resource text default null,
  p_resource_id text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (user_id, actor_role, action, resource, resource_id, metadata)
  values (auth.uid(), public.current_user_role(), p_action, p_resource, p_resource_id, p_metadata);
end $$;

-- ---------------------------------------------------------------------------
-- system_settings — key/value configuration surfaced in admin settings.
-- ---------------------------------------------------------------------------
create table if not exists public.system_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_settings_updated on public.system_settings;
create trigger trg_settings_updated
  before update on public.system_settings
  for each row execute function public.set_updated_at();
