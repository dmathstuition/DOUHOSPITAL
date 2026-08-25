-- ============================================================================
-- DOUHC — 0010 Nurse → doctor assignment
-- ----------------------------------------------------------------------------
-- The waiting_queue represents a patient's visit. A nurse now assigns each
-- visit to a specific doctor, who sees it on their "My Patients" worklist.
-- ============================================================================

alter table public.waiting_queue
  add column if not exists assigned_doctor_id uuid
    references public.doctors(id) on delete set null;

create index if not exists idx_queue_assigned_doctor
  on public.waiting_queue (assigned_doctor_id, status);
