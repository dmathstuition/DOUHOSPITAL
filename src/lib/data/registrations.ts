import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { RegistrationRequestRow } from '@/types/database';

export async function listRegistrationRequests(
  status?: 'pending' | 'approved' | 'rejected',
): Promise<RegistrationRequestRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from('registration_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) q = q.eq('status', status);
  const { data } = await q;
  return (data ?? []) as RegistrationRequestRow[];
}

export async function countPendingRegistrations(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('registration_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count ?? 0;
}

export async function getRegistrationRequest(
  id: string,
): Promise<RegistrationRequestRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('registration_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle<RegistrationRequestRow>();
  return data ?? null;
}
