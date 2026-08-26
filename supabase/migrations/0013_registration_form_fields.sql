-- ============================================================================
-- DOUHC — 0013 Registration form fields (Age, Doctor Notes, registration vitals)
-- ----------------------------------------------------------------------------
-- The patient records database captures, on registration:
--   • Age            — recorded directly (walk-in clinic; DOB stays optional and
--                      still derives age when present).
--   • Doctor Notes   — a free-text note kept on the patient record.
--   • Vital Signs    — BP, Temp, Weight, Height, Pulse — stored as an initial
--                      reading in vital_signs (the existing readings table), so
--                      each visit's vitals remain a dated, historical entry.
-- Idempotent: safe to re-run.
-- ============================================================================

alter table public.patients
  add column if not exists age   integer,
  add column if not exists notes text;

alter table public.patients drop constraint if exists patients_age_chk;
alter table public.patients
  add constraint patients_age_chk check (age is null or (age >= 0 and age <= 150));
