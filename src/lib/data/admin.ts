import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  DepartmentRow,
  DoctorRow,
  DoctorScheduleRow,
} from '@/types/database';

/** All departments (any status) for admin management. */
export async function listDepartments(): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });
  return (data ?? []) as DepartmentRow[];
}

/** Active departments only — used to populate selects. */
export async function listActiveDepartments(): Promise<
  Pick<DepartmentRow, 'id' | 'name'>[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('departments')
    .select('id, name')
    .eq('status', 'active')
    .order('name', { ascending: true });
  return (data ?? []) as Pick<DepartmentRow, 'id' | 'name'>[];
}

export async function getDepartment(id: string): Promise<DepartmentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .maybeSingle<DepartmentRow>();
  return data ?? null;
}

export interface DoctorWithDept extends DoctorRow {
  department_name: string | null;
}

/** All doctors (any status) with department name, for admin management. */
export async function listDoctorsAdmin(): Promise<DoctorWithDept[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('doctors')
    .select('*, departments:department_id ( name )')
    .order('full_name', { ascending: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((d) => ({
    ...d,
    department_name: d.departments?.name ?? null,
  })) as DoctorWithDept[];
}

export async function getDoctor(id: string): Promise<DoctorRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .maybeSingle<DoctorRow>();
  return data ?? null;
}

export async function getDoctorSchedules(
  doctorId: string,
): Promise<DoctorScheduleRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('doctor_schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  return (data ?? []) as DoctorScheduleRow[];
}
