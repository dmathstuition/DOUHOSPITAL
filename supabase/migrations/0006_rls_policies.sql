-- ============================================================================
-- DOUHC — 0006 Row Level Security policies
-- ----------------------------------------------------------------------------
-- Principles:
--   * RLS is enabled on every table.
--   * The Apps Script engine and trusted server actions use the service role,
--     which bypasses RLS — so no permissive policies are needed for automation.
--   * Patients can reach only their OWN records (via patients.profile_id).
--   * Clinical notes (medical_records) are staff-only.
--   * Marketing data (departments, doctors, schedules) is publicly readable.
-- ============================================================================

-- Helper: the patient row id owned by the current auth user (if any).
create or replace function public.current_patient_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.patients where profile_id = auth.uid() limit 1;
$$;

-- Enable RLS everywhere.
alter table public.profiles                 enable row level security;
alter table public.departments              enable row level security;
alter table public.patients                 enable row level security;
alter table public.doctors                  enable row level security;
alter table public.doctor_schedules         enable row level security;
alter table public.appointments             enable row level security;
alter table public.vital_signs              enable row level security;
alter table public.medical_records          enable row level security;
alter table public.prescriptions            enable row level security;
alter table public.prescription_items       enable row level security;
alter table public.medications              enable row level security;
alter table public.laboratory_tests         enable row level security;
alter table public.laboratory_results       enable row level security;
alter table public.patient_documents        enable row level security;
alter table public.waiting_queue            enable row level security;
alter table public.emergency_contacts       enable row level security;
alter table public.medical_alerts           enable row level security;
alter table public.notifications            enable row level security;
alter table public.notification_templates   enable row level security;
alter table public.notification_logs        enable row level security;
alter table public.sms_campaigns            enable row level security;
alter table public.sms_campaign_recipients  enable row level security;
alter table public.audit_logs               enable row level security;
alter table public.system_settings          enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = public.current_user_role());
create policy profiles_admin_all on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- departments / doctors / doctor_schedules — public read, admin write.
-- ---------------------------------------------------------------------------
create policy departments_public_read on public.departments
  for select using (true);
create policy departments_admin_write on public.departments
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy doctors_public_read on public.doctors
  for select using (true);
create policy doctors_admin_write on public.doctors
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy schedules_public_read on public.doctor_schedules
  for select using (true);
create policy schedules_admin_write on public.doctor_schedules
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- patients — staff read/write; patient reads own row.
-- ---------------------------------------------------------------------------
create policy patients_staff_read on public.patients
  for select using (public.is_staff() or profile_id = auth.uid());
create policy patients_staff_insert on public.patients
  for insert with check (public.has_role(array['super_admin','nurse','receptionist']::public.user_role[]));
create policy patients_staff_update on public.patients
  for update using (public.is_staff()) with check (public.is_staff());
-- No delete policy: patients are soft-deleted via status/deleted_at by staff update.

-- ---------------------------------------------------------------------------
-- appointments — staff manage; patient manages own.
-- ---------------------------------------------------------------------------
create policy appts_staff_all on public.appointments
  for all using (public.is_staff()) with check (public.is_staff());
create policy appts_patient_read on public.appointments
  for select using (patient_id = public.current_patient_id());
create policy appts_patient_insert on public.appointments
  for insert with check (patient_id = public.current_patient_id());
create policy appts_patient_update on public.appointments
  for update using (patient_id = public.current_patient_id())
  with check (patient_id = public.current_patient_id());

-- ---------------------------------------------------------------------------
-- vital_signs — nurses/doctors/admin manage; patient reads own.
-- ---------------------------------------------------------------------------
create policy vitals_clinical_all on public.vital_signs
  for all using (public.has_role(array['super_admin','nurse','doctor']::public.user_role[]))
  with check (public.has_role(array['super_admin','nurse','doctor']::public.user_role[]));
create policy vitals_patient_read on public.vital_signs
  for select using (patient_id = public.current_patient_id());

-- ---------------------------------------------------------------------------
-- medical_records — STAFF (clinical) only. Not patient-visible.
-- ---------------------------------------------------------------------------
create policy records_clinical_read on public.medical_records
  for select using (public.has_role(array['super_admin','doctor','nurse']::public.user_role[]));
create policy records_clinical_write on public.medical_records
  for all using (public.has_role(array['super_admin','doctor']::public.user_role[]))
  with check (public.has_role(array['super_admin','doctor']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- prescriptions & items — doctors/admin write; staff + owner read.
-- ---------------------------------------------------------------------------
create policy presc_staff_read on public.prescriptions
  for select using (public.is_staff() or patient_id = public.current_patient_id());
create policy presc_doctor_write on public.prescriptions
  for all using (public.has_role(array['super_admin','doctor']::public.user_role[]))
  with check (public.has_role(array['super_admin','doctor']::public.user_role[]));

create policy presc_items_read on public.prescription_items
  for select using (
    public.is_staff() or exists (
      select 1 from public.prescriptions p
      where p.id = prescription_id and p.patient_id = public.current_patient_id()
    ));
create policy presc_items_write on public.prescription_items
  for all using (public.has_role(array['super_admin','doctor','nurse']::public.user_role[]))
  with check (public.has_role(array['super_admin','doctor','nurse']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- medications (pharmacy) — staff read; admin/nurse write.
-- ---------------------------------------------------------------------------
create policy meds_staff_read on public.medications
  for select using (public.is_staff());
create policy meds_write on public.medications
  for all using (public.has_role(array['super_admin','nurse']::public.user_role[]))
  with check (public.has_role(array['super_admin','nurse']::public.user_role[]));

-- ---------------------------------------------------------------------------
-- laboratory — staff manage; patient reads own tests/results.
-- ---------------------------------------------------------------------------
create policy lab_staff_all on public.laboratory_tests
  for all using (public.is_staff()) with check (public.is_staff());
create policy lab_patient_read on public.laboratory_tests
  for select using (patient_id = public.current_patient_id());

create policy labres_staff_all on public.laboratory_results
  for all using (public.is_staff()) with check (public.is_staff());
create policy labres_patient_read on public.laboratory_results
  for select using (patient_id = public.current_patient_id());

-- ---------------------------------------------------------------------------
-- patient_documents — staff manage; patient reads own.
-- ---------------------------------------------------------------------------
create policy docs_staff_all on public.patient_documents
  for all using (public.is_staff()) with check (public.is_staff());
create policy docs_patient_read on public.patient_documents
  for select using (patient_id = public.current_patient_id());

-- ---------------------------------------------------------------------------
-- waiting_queue — staff only.
-- ---------------------------------------------------------------------------
create policy queue_staff_all on public.waiting_queue
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- emergency_contacts & medical_alerts — staff manage; patient reads own.
-- ---------------------------------------------------------------------------
create policy emergency_staff_all on public.emergency_contacts
  for all using (public.is_staff()) with check (public.is_staff());
create policy emergency_patient_read on public.emergency_contacts
  for select using (patient_id = public.current_patient_id());

create policy alerts_staff_all on public.medical_alerts
  for all using (public.is_staff()) with check (public.is_staff());
create policy alerts_patient_read on public.medical_alerts
  for select using (patient_id = public.current_patient_id());

-- ---------------------------------------------------------------------------
-- notifications & campaigns — super_admin visibility only (automation uses
-- the service role and bypasses RLS).
-- ---------------------------------------------------------------------------
create policy notifications_admin on public.notifications
  for select using (public.is_super_admin());
create policy notiftemplates_admin on public.notification_templates
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy notiflogs_admin on public.notification_logs
  for select using (public.is_super_admin());
create policy campaigns_admin on public.sms_campaigns
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy campaign_recips_admin on public.sms_campaign_recipients
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- audit_logs — super_admin read only. No insert/update/delete policies:
-- inserts happen via write_audit() (security definer) or the service role.
-- ---------------------------------------------------------------------------
create policy audit_admin_read on public.audit_logs
  for select using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- system_settings — staff read; super_admin write.
-- ---------------------------------------------------------------------------
create policy settings_staff_read on public.system_settings
  for select using (public.is_staff());
create policy settings_admin_write on public.system_settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());
