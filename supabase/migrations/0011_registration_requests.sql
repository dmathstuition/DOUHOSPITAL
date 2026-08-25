-- ============================================================================
-- DOUHC — 0011 Public patient registration requests
-- ----------------------------------------------------------------------------
-- Prospective patients submit a registration request from the public site.
-- Requests are NOT patient records — staff (admin/reception/nurse) review each
-- request and create the actual patient record, which then enters the normal
-- workflow. Submissions are inserted server-side with the service role; only
-- staff can read/manage requests (no anonymous read).
-- ============================================================================

do $$ begin
  create type public.registration_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.registration_requests (
  id                      uuid primary key default gen_random_uuid(),
  first_name              text not null,
  last_name               text not null,
  middle_name             text,
  sex                     public.sex_type,
  date_of_birth           date,
  blood_group             text,
  genotype                text,
  email                   citext,
  phone                   text,
  matric_number           text,
  student_id              text,
  faculty                 text,
  department              text,
  level                   text,
  address                 text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  note                    text,
  status                  public.registration_status not null default 'pending',
  patient_id              uuid references public.patients(id) on delete set null,
  reviewed_by             uuid references public.profiles(id) on delete set null,
  reviewed_at             timestamptz,
  created_at              timestamptz not null default now(),
  constraint reg_phone_e164 check (phone is null or phone ~ '^\+234[789]\d{9}$')
);

create index if not exists idx_reg_status on public.registration_requests (status, created_at desc);

alter table public.registration_requests enable row level security;

-- Staff read; register-capable roles manage. Submissions come in via the
-- service role (server action), so no anonymous insert policy is exposed.
drop policy if exists reg_staff_read on public.registration_requests;
create policy reg_staff_read on public.registration_requests
  for select using (public.is_staff());

drop policy if exists reg_staff_update on public.registration_requests;
create policy reg_staff_update on public.registration_requests
  for update using (public.has_role(array['super_admin','nurse','receptionist']::public.user_role[]))
  with check (public.has_role(array['super_admin','nurse','receptionist']::public.user_role[]));
