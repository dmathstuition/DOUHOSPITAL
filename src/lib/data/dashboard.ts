import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';
import type { AppointmentStatus } from '@/types/database';

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

export interface DashboardAnalytics {
  byDay: { day: string; count: number }[];
  byStatus: { status: string; label: string; count: number }[];
  byDepartment: { name: string; count: number }[];
  pendingLabResults: number;
  lowStockMedicines: number;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  in_consultation: 'In Consultation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Aggregations for the dashboard charts. Uses bounded head-count queries (no
 * row bodies fetched) grouped in app code, so it stays RLS-safe and cheap.
 * Returns empty datasets gracefully when the backend is not configured.
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const empty: DashboardAnalytics = {
    byDay: [],
    byStatus: [],
    byDepartment: [],
    pendingLabResults: 0,
    lowStockMedicines: 0,
  };
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createClient();
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const since = new Date(today);
    since.setDate(since.getDate() - 29);

    // Appointments per day for the last 7 days.
    const days: { day: string; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ day: WEEK[d.getDay()], date: iso(d) });
    }
    const byDayCounts = await Promise.all(
      days.map((d) =>
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', d.date),
      ),
    );
    const byDay = days.map((d, i) => ({ day: d.day, count: byDayCounts[i].count ?? 0 }));

    // Appointment status breakdown over the last 30 days.
    const statuses = Object.keys(STATUS_LABELS) as AppointmentStatus[];
    const byStatusCounts = await Promise.all(
      statuses.map((s) =>
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', s)
          .gte('appointment_date', iso(since)),
      ),
    );
    const byStatus = statuses
      .map((s, i) => ({ status: s, label: STATUS_LABELS[s], count: byStatusCounts[i].count ?? 0 }))
      .filter((x) => x.count > 0);

    // Appointments per clinical department over the last 30 days.
    const { data: depts } = await supabase
      .from('departments')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    const deptList = (depts ?? []) as { id: string; name: string }[];
    const byDeptCounts = await Promise.all(
      deptList.map((d) =>
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', d.id)
          .gte('appointment_date', iso(since)),
      ),
    );
    const byDepartment = deptList
      .map((d, i) => ({ name: d.name, count: byDeptCounts[i].count ?? 0 }))
      .filter((x) => x.count > 0);

    // Extra counters for the stat row.
    const [pendingLab, lowStock] = await Promise.all([
      supabase
        .from('laboratory_tests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['requested', 'sample_collected', 'processing', 'result_ready']),
      supabase.from('medications').select('quantity, reorder_level'),
    ]);
    const lowStockMedicines = (lowStock.data ?? []).filter(
      (m) => (m.quantity ?? 0) <= (m.reorder_level ?? 0),
    ).length;

    return {
      byDay,
      byStatus,
      byDepartment,
      pendingLabResults: pendingLab.count ?? 0,
      lowStockMedicines,
    };
  } catch {
    return empty;
  }
}
