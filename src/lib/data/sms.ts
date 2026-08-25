import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type Audience = 'all' | 'department' | 'faculty';

export interface RecipientFilter {
  audience: Audience;
  value?: string;
}

/** Count of patients with a phone number matching the filter. */
export async function previewRecipientCount(filter: RecipientFilter): Promise<number> {
  const supabase = await createClient();
  let q = supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .not('phone', 'is', null);

  if (filter.audience === 'department' && filter.value) q = q.eq('department', filter.value);
  if (filter.audience === 'faculty' && filter.value) q = q.eq('faculty', filter.value);

  const { count } = await q;
  return count ?? 0;
}

/** Distinct faculties present in patient records (for the filter dropdown). */
export async function listFaculties(): Promise<string[]> {
  return distinctColumn('faculty');
}

/** Distinct (academic) departments present in patient records. */
export async function listPatientDepartments(): Promise<string[]> {
  return distinctColumn('department');
}

async function distinctColumn(column: 'faculty' | 'department'): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('patients')
    .select(column)
    .not(column, 'is', null)
    .limit(2000);
  const set = new Set<string>();
  for (const r of data ?? []) {
    const v = (r as Record<string, string | null>)[column];
    if (v) set.add(v);
  }
  return Array.from(set).sort();
}
