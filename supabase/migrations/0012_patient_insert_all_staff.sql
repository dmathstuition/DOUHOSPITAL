-- ============================================================================
-- DOUHC — 0012 Allow every staff member to register patients
-- ----------------------------------------------------------------------------
-- Registering/filling patient details is now a task for ALL workers (nurse,
-- doctor, receptionist) and the admin — patients never self-register. Broaden
-- the patients INSERT policy from a fixed role list to any staff member.
-- (UPDATE was already open to all staff; DELETE stays admin-only via the app +
-- soft delete.)
-- ============================================================================

drop policy if exists patients_staff_insert on public.patients;
create policy patients_staff_insert on public.patients
  for insert with check (public.is_staff());
