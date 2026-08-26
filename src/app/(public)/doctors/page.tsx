import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';
import { formatTime } from '@/lib/utils';
import { siteConfig } from '@/lib/config';
import { DoctorsDirectory, type DirectoryDoctor } from '@/components/public/doctors-directory';

export const metadata: Metadata = {
  title: 'Doctors',
  description: `Meet the clinical team at ${siteConfig.name}.`,
};

async function getDoctors(): Promise<DirectoryDoctor[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const dayOfWeek = new Date().getDay(); // 0=Sun..6=Sat

    const [{ data: docs }, { data: duty }] = await Promise.all([
      supabase
        .from('doctors')
        .select('id, full_name, photo_url, specialization, departments:department_id ( name )')
        .eq('status', 'active')
        .order('full_name'),
      supabase
        .from('doctor_schedules')
        .select('doctor_id, start_time, end_time')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true),
    ]);

    // Map each doctor to today's earliest duty window, if any.
    const dutyByDoctor = new Map<string, { start: string; end: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (duty as any[]) ?? []) {
      const existing = dutyByDoctor.get(row.doctor_id);
      if (!existing || row.start_time < existing.start) {
        dutyByDoctor.set(row.doctor_id, { start: row.start_time, end: row.end_time });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((docs as any[]) ?? []).map((d) => {
      const shift = dutyByDoctor.get(d.id);
      return {
        id: d.id,
        full_name: d.full_name,
        photo_url: d.photo_url ?? null,
        specialization: d.specialization ?? null,
        department: d.departments?.name ?? null,
        on_duty: !!shift,
        hours: shift ? `${formatTime(shift.start)} – ${formatTime(shift.end)}` : null,
      };
    });
  } catch {
    return [];
  }
}

export default async function DoctorsPage() {
  const doctors = await getDoctors();
  return <DoctorsDirectory doctors={doctors} />;
}
