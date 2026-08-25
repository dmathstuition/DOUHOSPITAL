import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { PatientRow } from '@/types/database';

export interface PatientSearchParams {
  query?: string;
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export interface PatientSearchResult {
  rows: PatientRow[];
  count: number;
  page: number;
  pageSize: number;
}

/**
 * Paginated, filtered patient search. Never loads the whole table — always
 * bounded by range(). RLS restricts what the caller can actually see.
 */
export async function searchPatients(
  params: PatientSearchParams,
): Promise<PatientSearchResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let q = supabase
    .from('patients')
    .select(
      'id, patient_code, first_name, last_name, sex, phone, email, matric_number, department, faculty, status, registration_date',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('last_name', { ascending: true })
    .range(from, to);

  if (params.status) q = q.eq('status', params.status);

  const term = params.query?.trim();
  if (term) {
    // Search across name, matric, phone, email, patient_code.
    const like = `%${term}%`;
    q = q.or(
      [
        `first_name.ilike.${like}`,
        `last_name.ilike.${like}`,
        `matric_number.ilike.${like}`,
        `phone.ilike.${like}`,
        `email.ilike.${like}`,
        `patient_code.ilike.${like}`,
      ].join(','),
    );
  }

  const { data, count, error } = await q;
  if (error) {
    return { rows: [], count: 0, page, pageSize };
  }
  return {
    rows: (data ?? []) as unknown as PatientRow[],
    count: count ?? 0,
    page,
    pageSize,
  };
}

/** Fetch a single patient (RLS-guarded). Returns null when not found/allowed. */
export async function getPatient(id: string): Promise<PatientRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle<PatientRow>();
  return data ?? null;
}

/** Recent vital signs for a patient. */
export async function getPatientVitals(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(20);
  return data ?? [];
}

/** Upcoming + recent appointments for a patient. */
export async function getPatientAppointments(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('id, appointment_date, start_time, status, reason, doctor_id, department_id')
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: false })
    .limit(20);
  return data ?? [];
}

/** Active medical alerts for a patient (shown prominently). */
export async function getPatientAlerts(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('medical_alerts')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return data ?? [];
}
