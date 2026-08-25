# DOUHC — Database

PostgreSQL (Supabase). Migrations live in `supabase/migrations` and are applied
in filename order.

## Migration files

| File | Contents |
| --- | --- |
| `0001_extensions_enums_helpers.sql` | Extensions, enums, `updated_at` trigger, role helper functions |
| `0002_core_tables.sql` | `profiles`, `departments`, `patients`, `doctors`, `doctor_schedules` |
| `0003_appointments_clinical.sql` | `appointments`, `vital_signs`, `medical_records`, `prescriptions`(+items), `medications`, `laboratory_tests`, `laboratory_results`, `patient_documents`, `waiting_queue`, `emergency_contacts`, `medical_alerts` |
| `0004_notifications.sql` | `notifications`, `notification_templates`, `notification_logs`, `sms_campaigns`(+recipients) |
| `0005_audit_settings.sql` | `audit_logs` (append-only), `system_settings`, `write_audit()` |
| `0006_rls_policies.sql` | Enables RLS on every table + all policies |
| `0007_functions_triggers.sql` | Profile provisioning, patient codes, BMI, appointment validation, queue numbers, audit triggers |
| `0008_storage.sql` | Private/public storage buckets + policies |
| `0009_seed.sql` | Development seed data (clearly tagged, non-real) |

## Key design choices

- **UUID primary keys** via `gen_random_uuid()`.
- **Enums** for controlled vocabularies (roles, statuses, priorities).
- **Constraints**: unique `matric_number`, E.164 phone check on patients,
  blood-group/genotype checks, appointment time ordering.
- **Double-booking prevention**: partial unique index
  `uq_appt_doctor_slot (doctor_id, appointment_date, start_time)` excluding
  cancelled/no-show. A `validate_appointment()` trigger also blocks bookings
  outside a doctor's active schedule.
- **Soft delete**: patients use `status` + `deleted_at` rather than hard delete.
- **Audit**: `audit_logs` is append-only (update/delete blocked by trigger);
  write triggers record changes to patients, records, prescriptions, lab
  results and appointments.

## Row Level Security (summary)

| Table | Patient | Receptionist | Nurse | Doctor | Super Admin |
| --- | --- | --- | --- | --- | --- |
| patients | own row (read) | read/write | read/write | read | full |
| appointments | own (CRUD) | full | full | full | full |
| vital_signs | own (read) | — | read/write | read/write | full |
| medical_records | — | — | read | read/write | full |
| prescriptions | own (read) | — | items | read/write | full |
| laboratory_* | own (read) | read/write | read/write | read/write | full |
| medications | — | read | read/write | read | full |
| notifications/audit | — | — | — | — | read |
| departments/doctors | public read | public read | public read | public read | write |

Automation (Google Apps Script) uses the **service role**, which bypasses RLS —
so no permissive policies are exposed to ordinary users for the notification
tables.

## Regenerating TypeScript types

```bash
supabase gen types typescript --project-id <id> > src/types/database.ts
```

The committed `src/types/database.ts` is a hand-authored mirror kept in sync
with these migrations until generation is wired into CI.
