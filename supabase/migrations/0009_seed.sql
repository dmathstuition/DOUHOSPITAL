-- ============================================================================
-- DOUHC — 0009 Development seed data
-- ----------------------------------------------------------------------------
-- SAFE, NON-REAL sample data for local development ONLY.
-- Never contains real patient information. Sample patients are marked with the
-- "DEV-SEED" tag in their student_id so they are easy to identify and purge.
-- To remove: delete from patients where student_id = 'DEV-SEED';
-- ============================================================================

-- Departments -----------------------------------------------------------------
insert into public.departments (name, description, location, status) values
  ('General Outpatient', 'First point of contact for consultations and treatment.', 'Ground Floor, Block A', 'active'),
  ('Laboratory',         'Diagnostic testing and sample analysis.',                 'Ground Floor, Block B', 'active'),
  ('Pharmacy',           'Dispensing of prescribed medications.',                    'Ground Floor, Block A', 'active'),
  ('Dental',             'Oral health assessment and treatment.',                    'First Floor, Block C',  'active'),
  ('Antenatal',          'Maternal and antenatal care.',                             'First Floor, Block C',  'active'),
  ('Emergency',          'Urgent and emergency medical response.',                   'Ground Floor, Block A', 'active'),
  ('Health Screening',   'Preventive screening and wellness checks.',                'First Floor, Block B',  'active')
on conflict (name) do nothing;

-- System settings -------------------------------------------------------------
insert into public.system_settings (key, value) values
  ('health_center', '{"name":"Dennis Osadebay University Health Center","short_name":"DOUHC","address":"Dennis Osadebay University, Asaba, Delta State, Nigeria","email":"healthcenter@dou.edu.ng","phone":"+234 800 000 0000","emergency_phone":"+234 800 000 0911"}'::jsonb),
  ('appointments', '{"consultation_minutes":30,"booking_window_days":30,"allow_cancellation":true,"cancellation_hours":12}'::jsonb),
  ('notifications', '{"sms_enabled":true,"email_enabled":true,"reminder_hours_before":24,"follow_up_days_after":2}'::jsonb),
  ('sms', '{"provider":"termii","sender_id":"DOUHC","configured":false}'::jsonb),
  ('privacy', '{"retention_years":7,"notice_version":1}'::jsonb)
on conflict (key) do nothing;

-- Notification templates ------------------------------------------------------
insert into public.notification_templates (key, channel, subject, body) values
  ('appointment_confirmation_sms', 'sms', null,
   'Hello {{name}}, your appointment at DOUHC has been booked for {{date}} at {{time}} with Dr {{doctor}} in {{department}}.'),
  ('appointment_reminder_sms', 'sms', null,
   'Hello {{name}}, reminder: Your appointment at DOUHC {{department}} with Dr {{doctor}} is tomorrow {{date}} {{time}}.'),
  ('follow_up_sms', 'sms', null,
   'Hello {{name}}, this is DOUHC. How are you feeling? Please reply if you need a follow-up.'),
  ('appointment_confirmation_email', 'email', 'Appointment Confirmed — DOUHC',
   'Dear {{name}}, your appointment at DOUHC has been confirmed for {{date}} at {{time}} with Dr {{doctor}} in {{department}}.'),
  ('welcome_email', 'email', 'Welcome to DOUHC',
   'Dear {{name}}, welcome to the Dennis Osadebay University Health Center. Your patient record has been created.')
on conflict (key) do nothing;

-- Sample doctors (no auth users required; profile_id left null) ----------------
insert into public.doctors (id, full_name, department_id, specialization, email, phone, status)
select
  d.id, d.full_name,
  (select id from public.departments where name = d.dept),
  d.spec, d.email, d.phone, 'active'
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Amaka Obi',    'General Outpatient', 'General Practice', 'a.obi@dou.edu.ng',    '+2348010000001'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Chidi Eze',    'Dental',             'Dental Surgery',   'c.eze@dou.edu.ng',    '+2348010000002'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Ngozi Ade',    'Antenatal',          'Obstetrics',       'n.ade@dou.edu.ng',    '+2348010000003')
) as d(id, full_name, dept, spec, email, phone)
on conflict (id) do nothing;

-- Weekly schedules: Mon–Fri 08:00–16:00 for each sample doctor ----------------
insert into public.doctor_schedules (doctor_id, day_of_week, start_time, end_time, consultation_minutes)
select doc.id, dow, time '08:00', time '16:00', 30
from public.doctors doc
cross join generate_series(1, 5) as dow
where doc.id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333')
on conflict (doctor_id, day_of_week, start_time) do nothing;

-- Sample patients (clearly tagged DEV-SEED) -----------------------------------
insert into public.patients
  (first_name, last_name, sex, date_of_birth, blood_group, genotype, email, phone,
   matric_number, student_id, faculty, department, level, status)
values
  ('Test', 'Student-A', 'female', '2003-05-12', 'O+', 'AA', 'sample.a@example.com', '+2348020000001',
   'DOU/2021/0001', 'DEV-SEED', 'Science', 'Computer Science', '300', 'active'),
  ('Test', 'Student-B', 'male', '2002-11-03', 'A+', 'AS', 'sample.b@example.com', '+2348020000002',
   'DOU/2021/0002', 'DEV-SEED', 'Arts', 'History', '200', 'active'),
  ('Test', 'Student-C', 'female', '2004-02-21', 'B+', 'AA', 'sample.c@example.com', '+2348020000003',
   'DOU/2022/0003', 'DEV-SEED', 'Management', 'Accounting', '100', 'active')
on conflict (matric_number) do nothing;

-- Sample medications ----------------------------------------------------------
insert into public.medications (name, category, batch_number, quantity, expiry_date, reorder_level, price) values
  ('Paracetamol 500mg', 'Analgesic', 'PCM-2026-01', 500, '2027-06-30', 100, 15.00),
  ('Amoxicillin 250mg', 'Antibiotic', 'AMX-2026-02', 40, '2026-12-31', 50, 45.00),
  ('Artemether/Lumefantrine', 'Antimalarial', 'ACT-2026-03', 200, '2027-03-31', 60, 120.00),
  ('Oral Rehydration Salt', 'Electrolyte', 'ORS-2026-04', 8, '2026-10-31', 30, 20.00)
on conflict do nothing;
