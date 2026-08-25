-- ============================================================================
-- DOUHC — 0008 Storage buckets & policies
-- ----------------------------------------------------------------------------
-- Medical documents live in PRIVATE buckets and are only ever served via
-- short-lived signed URLs generated server-side. Public buckets hold only
-- non-sensitive branding / profile imagery.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('lab-results',       'lab-results',       false),
  ('patient-documents', 'patient-documents', false),
  ('doctor-photos',     'doctor-photos',     true),
  ('branding',          'branding',          true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Private medical buckets: staff full access; patients read only their own
-- folder, where object paths are prefixed with "<patient_uuid>/...".
-- ---------------------------------------------------------------------------
drop policy if exists "medical_staff_all" on storage.objects;
create policy "medical_staff_all"
  on storage.objects for all
  using (
    bucket_id in ('lab-results', 'patient-documents') and public.is_staff()
  )
  with check (
    bucket_id in ('lab-results', 'patient-documents') and public.is_staff()
  );

drop policy if exists "medical_patient_read_own" on storage.objects;
create policy "medical_patient_read_own"
  on storage.objects for select
  using (
    bucket_id in ('lab-results', 'patient-documents')
    and (storage.foldername(name))[1] = public.current_patient_id()::text
  );

-- ---------------------------------------------------------------------------
-- Public buckets: anyone can read; only super_admin can write.
-- ---------------------------------------------------------------------------
drop policy if exists "public_read" on storage.objects;
create policy "public_read"
  on storage.objects for select
  using (bucket_id in ('doctor-photos', 'branding'));

drop policy if exists "public_admin_write" on storage.objects;
create policy "public_admin_write"
  on storage.objects for insert
  with check (bucket_id in ('doctor-photos', 'branding') and public.is_super_admin());

drop policy if exists "public_admin_update" on storage.objects;
create policy "public_admin_update"
  on storage.objects for update
  using (bucket_id in ('doctor-photos', 'branding') and public.is_super_admin());

drop policy if exists "public_admin_delete" on storage.objects;
create policy "public_admin_delete"
  on storage.objects for delete
  using (bucket_id in ('doctor-photos', 'branding') and public.is_super_admin());
