import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';

export interface DashboardStats {
  patientsToday: number;
  appointmentsToday: number;
  appointmentsTomorrow: number;
  waitingPatients: number;
  doctorsOnDuty: number;
  pendingLabResults: number;
  lowStockMedicines: number;
  configured: boolean;
}

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregate dashboard counters. Uses head-count queries (no row data fetched)
 * so no unnecessary medical data crosses the wire. Returns zeros gracefully
 * when the backend is not configured.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const base: DashboardStats = {
    patientsToday: 0,
    appointmentsToday: 0,
    appointmentsTomorrow: 0,
    waitingPatients: 0,
    doctorsOnDuty: 0,
    pendingLabResults: 0,
    lowStockMedicines: 0,
    configured: false,
  };
  if (!isSupabaseConfigured()) return base;

  try {
    const supabase = await createClient();
    const today = isoDate(0);
    const tomorrow = isoDate(1);
    const dayOfWeek = new Date().getDay();

    const [
      patientsToday,
      appointmentsToday,
      appointmentsTomorrow,
      waitingPatients,
      doctorsOnDuty,
    ] = await Promise.all([
      supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('registration_date', today),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', tomorrow),
      supabase
        .from('waiting_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting'),
      supabase
        .from('doctor_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true),
    ]);

    return {
      ...base,
      configured: true,
      patientsToday: patientsToday.count ?? 0,
      appointmentsToday: appointmentsToday.count ?? 0,
      appointmentsTomorrow: appointmentsTomorrow.count ?? 0,
      waitingPatients: waitingPatients.count ?? 0,
      doctorsOnDuty: doctorsOnDuty.count ?? 0,
    };
  } catch {
    return base;
  }
}
