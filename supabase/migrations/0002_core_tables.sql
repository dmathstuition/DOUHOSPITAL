-- ============================================================================
-- DOUHC — 0002 Core tables: profiles, patients, departments, doctors, schedules
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, holds the trusted role.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  role         public.user_role not null default 'patient',
  phone        text,
  avatar_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------
create table if not exists public.departments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  description   text,
  location      text,
  phone         text,
  opening_hours text,
  status        public.entity_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_departments_updated
  before update on public.departments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id                      uuid primary key default gen_random_uuid(),
  patient_code            text not null unique,
  profile_id              uuid references public.profiles(id) on delete set null,
  first_name              text not null,
  last_name               text not null,
  middle_name             text,
  sex                     public.sex_type,
  date_of_birth           date,
  blood_group             text,
  genotype                text,
  email                   citext,
  phone                   text,
  matric_number           text unique,
  student_id              text,
  faculty                 text,
  department              text,
  level                   text,
  address                 text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  registration_date       date not null default current_date,
  status                  public.entity_status not null default 'active',
  deleted_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  -- Nigerian E.164 phone shape (nullable allowed).
  constraint patients_phone_e164 check (phone is null or phone ~ '^\+234[789]\d{9}$'),
  constraint patients_blood_group_chk check
    (blood_group is null or blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  constraint patients_genotype_chk check
    (genotype is null or genotype in ('AA','AS','SS','AC','SC'))
);

create index if not exists idx_patients_last_name on public.patients (last_name);
create index if not exists idx_patients_matric on public.patients (matric_number);
create index if not exists idx_patients_profile on public.patients (profile_id);
create index if not exists idx_patients_status on public.patients (status);
create index if not exists idx_patients_reg_date on public.patients (registration_date);
-- Trigram-style search assist on names.
create index if not exists idx_patients_name_search
  on public.patients (lower(first_name), lower(last_name));

create trigger trg_patients_updated
  before update on public.patients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
create table if not exists public.doctors (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references public.profiles(id) on delete set null,
  full_name      text not null,
  photo_url      text,
  department_id  uuid references public.departments(id) on delete set null,
  specialization text,
  email          citext,
  phone          text,
  biography      text,
  status         public.entity_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_doctors_department on public.doctors (department_id);
create index if not exists idx_doctors_status on public.doctors (status);
create index if not exists idx_doctors_profile on public.doctors (profile_id);

create trigger trg_doctors_updated
  before update on public.doctors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- doctor_schedules — recurring weekly availability
-- ---------------------------------------------------------------------------
create table if not exists public.doctor_schedules (
  id                   uuid primary key default gen_random_uuid(),
  doctor_id            uuid not null references public.doctors(id) on delete cascade,
  day_of_week          smallint not null check (day_of_week between 0 and 6),
  start_time           time not null,
  end_time             time not null,
  consultation_minutes integer not null default 30 check (consultation_minutes between 5 and 240),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint doctor_schedule_time_order check (end_time > start_time),
  constraint doctor_schedule_unique unique (doctor_id, day_of_week, start_time)
);

create index if not exists idx_schedule_doctor on public.doctor_schedules (doctor_id);
create index if not exists idx_schedule_day on public.doctor_schedules (day_of_week);

create trigger trg_schedules_updated
  before update on public.doctor_schedules
  for each row execute function public.set_updated_at();
