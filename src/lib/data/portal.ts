import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { PatientRow } from '@/types/database';

/** The patient record linked to the current auth user (RLS: own row only). */
export async function getMyPatientRecord(): Promise<PatientRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle<PatientRow>();
  return data ?? null;
}

/** Current user's own appointments. */
export async function getMyAppointments(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('id, appointment_date, start_time, status, reason')
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: false })
    .limit(10);
  return data ?? [];
}

/** Current user's own prescriptions. */
export async function getMyPrescriptions(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('prescriptions')
    .select('id, diagnosis, status, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(10);
  return data ?? [];
}
