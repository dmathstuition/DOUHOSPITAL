-- ============================================================================
-- DOUHC — 0007 Business-logic functions & triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Auto-provision a profile when an auth user is created.
-- SECURITY: the role is ALWAYS forced to 'patient' here. Self-signup metadata
-- is user-controlled and must never be trusted to grant staff privileges — an
-- admin elevates roles explicitly afterwards.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    'patient',
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Patient code generation: DOUHC-P-00001
-- ---------------------------------------------------------------------------
create sequence if not exists public.patient_code_seq start 1;

create or replace function public.assign_patient_code()
returns trigger language plpgsql as $$
begin
  if new.patient_code is null or new.patient_code = '' then
    new.patient_code := 'DOUHC-P-' || lpad(nextval('public.patient_code_seq')::text, 5, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_patient_code on public.patients;
create trigger trg_patient_code
  before insert on public.patients
  for each row execute function public.assign_patient_code();

-- ---------------------------------------------------------------------------
-- BMI auto-calculation for vital signs (height stored in cm).
-- ---------------------------------------------------------------------------
create or replace function public.compute_bmi()
returns trigger language plpgsql as $$
begin
  if new.weight is not null and new.height is not null and new.height > 0 then
    new.bmi := round((new.weight / power(new.height / 100.0, 2))::numeric, 1);
  end if;
  return new;
end $$;

drop trigger if exists trg_vitals_bmi on public.vital_signs;
create trigger trg_vitals_bmi
  before insert or update on public.vital_signs
  for each row execute function public.compute_bmi();

-- ---------------------------------------------------------------------------
-- Appointment validation: doctor active + slot within an active schedule.
-- The unique index uq_appt_doctor_slot already prevents double-booking; this
-- guards against booking outside working hours / inactive doctors.
-- ---------------------------------------------------------------------------
create or replace function public.validate_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_doctor_active boolean;
  v_has_slot boolean;
begin
  select (status = 'active') into v_doctor_active
    from public.doctors where id = new.doctor_id;

  if not coalesce(v_doctor_active, false) then
    raise exception 'Doctor is not available for booking';
  end if;

  select exists (
    select 1 from public.doctor_schedules s
    where s.doctor_id = new.doctor_id
      and s.is_active
      and s.day_of_week = extract(dow from new.appointment_date)::smallint
      and new.start_time >= s.start_time
      and new.end_time   <= s.end_time
  ) into v_has_slot;

  if not v_has_slot then
    raise exception 'Requested time is outside the doctor''s working hours';
  end if;

  return new;
end $$;

drop trigger if exists trg_validate_appointment on public.appointments;
create trigger trg_validate_appointment
  before insert or update of doctor_id, appointment_date, start_time, end_time
  on public.appointments
  for each row execute function public.validate_appointment();

-- ---------------------------------------------------------------------------
-- Queue number generation: DOUHC-001 (resets daily). Advisory lock avoids a
-- race between concurrent check-ins.
-- ---------------------------------------------------------------------------
create or replace function public.assign_queue_number()
returns trigger language plpgsql as $$
declare
  v_count integer;
begin
  if new.queue_number is null or new.queue_number = '' then
    perform pg_advisory_xact_lock(hashtext('douhc_queue_' || current_date::text));
    select count(*) into v_count
      from public.waiting_queue
      where checked_in_at::date = current_date;
    new.queue_number := 'DOUHC-' || lpad((v_count + 1)::text, 3, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_queue_number on public.waiting_queue;
create trigger trg_queue_number
  before insert on public.waiting_queue
  for each row execute function public.assign_queue_number();

-- ---------------------------------------------------------------------------
-- Generic audit trigger for write operations on sensitive tables.
-- ---------------------------------------------------------------------------
create or replace function public.audit_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id text;
begin
  v_id := coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id'));
  insert into public.audit_logs (user_id, actor_role, action, resource, resource_id, metadata)
  values (
    auth.uid(),
    public.current_user_role(),
    lower(tg_op) || '_' || tg_table_name,
    tg_table_name,
    v_id,
    jsonb_build_object('op', tg_op)
  );
  return coalesce(new, old);
end $$;

-- Attach audit triggers to sensitive tables (writes only).
drop trigger if exists trg_audit_patients on public.patients;
create trigger trg_audit_patients
  after insert or update or delete on public.patients
  for each row execute function public.audit_write();

drop trigger if exists trg_audit_records on public.medical_records;
create trigger trg_audit_records
  after insert or update or delete on public.medical_records
  for each row execute function public.audit_write();

drop trigger if exists trg_audit_prescriptions on public.prescriptions;
create trigger trg_audit_prescriptions
  after insert or update or delete on public.prescriptions
  for each row execute function public.audit_write();

drop trigger if exists trg_audit_labresults on public.laboratory_results;
create trigger trg_audit_labresults
  after insert or update or delete on public.laboratory_results
  for each row execute function public.audit_write();

drop trigger if exists trg_audit_appointments on public.appointments;
create trigger trg_audit_appointments
  after insert or update or delete on public.appointments
  for each row execute function public.audit_write();
