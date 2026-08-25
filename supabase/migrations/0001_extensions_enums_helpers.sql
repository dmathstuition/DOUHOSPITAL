-- ============================================================================
-- DOUHC — 0001 Extensions, enums and shared helper functions
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";         -- case-insensitive text (emails)

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum
    ('super_admin', 'doctor', 'nurse', 'receptionist', 'patient');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.entity_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sex_type as enum ('male', 'female');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum
    ('pending', 'confirmed', 'checked_in', 'in_consultation',
     'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum ('sms', 'email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_status as enum
    ('pending', 'processing', 'sent', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lab_status as enum
    ('requested', 'sample_collected', 'processing', 'result_ready', 'reviewed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lab_priority as enum ('routine', 'urgent', 'stat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.queue_status as enum
    ('waiting', 'called', 'with_nurse', 'waiting_for_doctor',
     'in_consultation', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prescription_status as enum ('active', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dispense_status as enum ('pending', 'partial', 'dispensed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.alert_type as enum ('drug_allergy', 'severe_allergy', 'condition');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER, used by RLS). These read the caller's role
-- from profiles using auth.uid(). search_path pinned to avoid hijacking.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid())
      in ('super_admin', 'doctor', 'nurse', 'receptionist'),
    false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) = 'super_admin',
    false);
$$;

create or replace function public.has_role(roles public.user_role[])
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()) = any(roles),
    false);
$$;
