-- ============================================================================
-- DOUHC — 0003 Appointments & clinical tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.patients(id) on delete cascade,
  doctor_id        uuid not null references public.doctors(id) on delete restrict,
  department_id    uuid not null references public.departments(id) on delete restrict,
  appointment_date date not null,
  start_time       time not null,
  end_time         time not null,
  reason           text,
  status           public.appointment_status not null default 'pending',
  reminder_sent    boolean not null default false,
  follow_up_sent   boolean not null default false,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint appt_time_order check (end_time > start_time),
  constraint appt_not_past check (appointment_date >= '2000-01-01')
);

-- Prevent double-booking a doctor for the same slot (ignore cancelled/no-show).
create unique index if not exists uq_appt_doctor_slot
  on public.appointments (doctor_id, appointment_date, start_time)
  where status not in ('cancelled', 'no_show');

create index if not exists idx_appt_patient on public.appointments (patient_id);
create index if not exists idx_appt_doctor on public.appointments (doctor_id);
create index if not exists idx_appt_date on public.appointments (appointment_date);
create index if not exists idx_appt_status on public.appointments (status);
create index if not exists idx_appt_reminder
  on public.appointments (appointment_date) where reminder_sent = false;

drop trigger if exists trg_appt_updated on public.appointments;
create trigger trg_appt_updated
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- vital_signs — historical readings
-- ---------------------------------------------------------------------------
create table if not exists public.vital_signs (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.patients(id) on delete cascade,
  recorded_by       uuid references public.profiles(id) on delete set null,
  blood_pressure    text,
  temperature       numeric(4,1),
  weight            numeric(5,2),
  height            numeric(5,2),
  pulse             integer,
  respiratory_rate  integer,
  oxygen_saturation integer check (oxygen_saturation between 0 and 100),
  bmi               numeric(4,1),
  recorded_at       timestamptz not null default now()
);
create index if not exists idx_vitals_patient on public.vital_signs (patient_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- medical_records / consultations
-- ---------------------------------------------------------------------------
create table if not exists public.medical_records (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  doctor_id      uuid references public.doctors(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  symptoms       text,
  examination    text,
  diagnosis      text,
  treatment_plan text,
  doctor_notes   text,
  follow_up_date date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_records_patient on public.medical_records (patient_id, created_at desc);
create index if not exists idx_records_doctor on public.medical_records (doctor_id);

drop trigger if exists trg_records_updated on public.medical_records;
create trigger trg_records_updated
  before update on public.medical_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- prescriptions & items
-- ---------------------------------------------------------------------------
create table if not exists public.prescriptions (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id  uuid references public.doctors(id) on delete set null,
  record_id  uuid references public.medical_records(id) on delete set null,
  diagnosis  text,
  status     public.prescription_status not null default 'active',
  dispense_state public.dispense_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_presc_patient on public.prescriptions (patient_id, created_at desc);
create index if not exists idx_presc_status on public.prescriptions (status);

drop trigger if exists trg_presc_updated on public.prescriptions;
create trigger trg_presc_updated
  before update on public.prescriptions
  for each row execute function public.set_updated_at();

create table if not exists public.prescription_items (
  id              uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication_name text not null,
  dosage          text,
  frequency       text,
  duration        text,
  route           text,
  instructions    text,
  quantity        integer,
  dispensed_qty   integer not null default 0
);
create index if not exists idx_presc_items_presc on public.prescription_items (prescription_id);

-- ---------------------------------------------------------------------------
-- medications (pharmacy inventory)
-- ---------------------------------------------------------------------------
create table if not exists public.medications (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text,
  batch_number  text,
  quantity      integer not null default 0 check (quantity >= 0),
  expiry_date   date,
  reorder_level integer not null default 10,
  supplier      text,
  price         numeric(10,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_meds_name on public.medications (lower(name));
create index if not exists idx_meds_expiry on public.medications (expiry_date);
create index if not exists idx_meds_lowstock on public.medications (quantity);

drop trigger if exists trg_meds_updated on public.medications;
create trigger trg_meds_updated
  before update on public.medications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- laboratory_tests (requests) & laboratory_results
-- ---------------------------------------------------------------------------
create table if not exists public.laboratory_tests (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  doctor_id      uuid references public.doctors(id) on delete set null,
  test_name      text not null,
  clinical_reason text,
  priority       public.lab_priority not null default 'routine',
  requested_date date not null default current_date,
  status         public.lab_status not null default 'requested',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_lab_patient on public.laboratory_tests (patient_id, created_at desc);
create index if not exists idx_lab_status on public.laboratory_tests (status);

drop trigger if exists trg_lab_updated on public.laboratory_tests;
create trigger trg_lab_updated
  before update on public.laboratory_tests
  for each row execute function public.set_updated_at();

create table if not exists public.laboratory_results (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references public.laboratory_tests(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  result_summary  text,
  reference_range text,
  interpretation  text,
  comments        text,
  file_path       text,         -- private Supabase Storage object path
  reviewed_by     uuid references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_labresult_patient on public.laboratory_results (patient_id, created_at desc);
create index if not exists idx_labresult_test on public.laboratory_results (test_id);

-- ---------------------------------------------------------------------------
-- patient_documents (private storage references)
-- ---------------------------------------------------------------------------
create table if not exists public.patient_documents (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  title       text not null,
  file_path   text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_docs_patient on public.patient_documents (patient_id);

-- ---------------------------------------------------------------------------
-- waiting_queue
-- ---------------------------------------------------------------------------
create table if not exists public.waiting_queue (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  queue_number  text not null,
  status        public.queue_status not null default 'waiting',
  checked_in_at timestamptz not null default now(),
  completed_at  timestamptz,
  created_by    uuid references public.profiles(id) on delete set null
);
create index if not exists idx_queue_status on public.waiting_queue (status, checked_in_at);
-- One active queue entry per day per number.
create unique index if not exists uq_queue_number_day
  on public.waiting_queue (queue_number, (checked_in_at::date));

-- ---------------------------------------------------------------------------
-- emergency_contacts & medical_alerts
-- ---------------------------------------------------------------------------
create table if not exists public.emergency_contacts (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  name         text not null,
  relationship text,
  phone        text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_emergency_patient on public.emergency_contacts (patient_id);

create table if not exists public.medical_alerts (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  alert_type  public.alert_type not null,
  description text not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_alerts_patient on public.medical_alerts (patient_id);

drop trigger if exists trg_alerts_updated on public.medical_alerts;
create trigger trg_alerts_updated
  before update on public.medical_alerts
  for each row execute function public.set_updated_at();
