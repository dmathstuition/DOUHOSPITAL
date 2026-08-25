import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlots, isSlotInPast, type Slot } from '@/lib/appointments/slots';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';
import type { AppointmentStatus } from '@/types/database';

/** Active doctors in a department, for the booking wizard. */
export async function getDoctorsByDepartment(departmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('doctors')
    .select('id, full_name, specialization')
    .eq('department_id', departmentId)
    .eq('status', 'active')
    .order('full_name');
  return data ?? [];
}

/**
 * Available slots for a doctor on a date. Combines the doctor's active
 * schedule windows for that weekday with already-booked start times, and drops
 * past slots for today. The DB unique index is the final guard against races.
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
): Promise<Slot[]> {
  const supabase = await createClient();
  const dow = new Date(`${date}T00:00:00`).getDay();

  // Busy start-times are read with the service role so a patient sees accurate
  // availability without RLS hiding *other* patients' bookings. Only start_time
  // and status are selected — no patient-identifying data. Falls back to the
  // user client when the service role is unavailable.
  let busyClient: typeof supabase = supabase;
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      busyClient = createAdminClient() as unknown as typeof supabase;
    } catch {
      busyClient = supabase;
    }
  }

  const [{ data: windows }, { data: booked }] = await Promise.all([
    supabase
      .from('doctor_schedules')
      .select('start_time, end_time, consultation_minutes')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dow)
      .eq('is_active', true),
    busyClient
      .from('appointments')
      .select('start_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date),
  ]);

  if (!windows || windows.length === 0) return [];

  const takenStarts = (booked ?? [])
    .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show')
    .map((a) => a.start_time as string);

  return generateSlots(windows, takenStarts).filter(
    (s) => !isSlotInPast(date, s.start),
  );
}

export interface StaffAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  patient_name: string;
  patient_id: string;
  doctor_name: string;
  department_name: string;
}

/** Appointments for a given date, with related names, for staff views. */
export async function listAppointmentsByDate(date: string): Promise<StaffAppointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select(
      `id, appointment_date, start_time, end_time, status, reason, patient_id,
       patients:patient_id ( first_name, last_name ),
       doctors:doctor_id ( full_name ),
       departments:department_id ( name )`,
    )
    .eq('appointment_date', date)
    .order('start_time', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((a) => ({
    id: a.id,
    appointment_date: a.appointment_date,
    start_time: a.start_time,
    end_time: a.end_time,
    status: a.status,
    reason: a.reason,
    patient_id: a.patient_id,
    patient_name: a.patients
      ? `${a.patients.first_name} ${a.patients.last_name}`
      : 'Unknown',
    doctor_name: a.doctors?.full_name ?? 'Unknown',
    department_name: a.departments?.name ?? '—',
  }));
}
