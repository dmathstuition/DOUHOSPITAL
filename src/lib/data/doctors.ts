import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';

export interface DutyDoctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialization: string | null;
  department: string | null;
  start_time: string;
  end_time: string;
}

/**
 * Doctors scheduled to work *today*, derived from doctor_schedules.
 * Returns [] gracefully when the backend is not yet configured so the public
 * homepage always renders.
 */
export async function getDoctorsOnDutyToday(): Promise<DutyDoctor[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const dayOfWeek = new Date().getDay(); // 0=Sun..6=Sat

    const { data, error } = await supabase
      .from('doctor_schedules')
      .select(
        `start_time, end_time,
         doctors:doctor_id ( id, full_name, photo_url, specialization, status,
           departments:department_id ( name ) )`,
      )
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (error || !data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])
      .filter((row) => row.doctors && row.doctors.status === 'active')
      .map((row) => ({
        id: row.doctors.id,
        full_name: row.doctors.full_name,
        photo_url: row.doctors.photo_url,
        specialization: row.doctors.specialization,
        department: row.doctors.departments?.name ?? null,
        start_time: row.start_time,
        end_time: row.end_time,
      }));
  } catch {
    return [];
  }
}
