import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WaitingQueueRow } from '@/types/database';

export interface WorklistEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  queue_number: string;
  status: WaitingQueueRow['status'];
  checked_in_at: string;
}

/** The doctor record id linked to the current auth user, or null. */
export async function getMyDoctorId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('doctors')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

/** Today's active visits assigned to a given doctor. */
export async function getDoctorWorklist(doctorId: string): Promise<WorklistEntry[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('waiting_queue')
    .select(
      `id, patient_id, queue_number, status, checked_in_at,
       patients:patient_id ( first_name, last_name, patient_code )`,
    )
    .eq('assigned_doctor_id', doctorId)
    .neq('status', 'completed')
    .gte('checked_in_at', `${today}T00:00:00`)
    .order('checked_in_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((q) => ({
    id: q.id,
    patient_id: q.patient_id,
    patient_name: q.patients
      ? `${q.patients.first_name} ${q.patients.last_name}`
      : 'Unknown',
    patient_code: q.patients?.patient_code ?? '—',
    queue_number: q.queue_number,
    status: q.status,
    checked_in_at: q.checked_in_at,
  }));
}
