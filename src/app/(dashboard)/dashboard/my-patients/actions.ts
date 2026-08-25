'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { getMyDoctorId } from '@/lib/data/worklist';
import type { WaitingQueueRow } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * A doctor advances one of THEIR OWN assigned visits (e.g. start consultation,
 * complete). Ownership is verified server-side: the queue entry must be
 * assigned to the calling doctor.
 */
export async function advanceVisitAction(
  queueId: string,
  status: Extract<WaitingQueueRow['status'], 'in_consultation' | 'completed'>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (user.role !== ROLES.DOCTOR && user.role !== ROLES.SUPER_ADMIN) {
    return { ok: false, error: 'Not authorized.' };
  }

  const supabase = await createClient();
  const doctorId = await getMyDoctorId();

  // Super admins can act on any entry; doctors only on their assignments.
  let query = supabase.from('waiting_queue').update({
    status,
    ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
  }).eq('id', queueId);

  if (user.role === ROLES.DOCTOR) {
    if (!doctorId) return { ok: false, error: 'No doctor record is linked to your account.' };
    query = query.eq('assigned_doctor_id', doctorId);
  }

  const { error } = await query;
  if (error) return { ok: false, error: 'Unable to update the visit.' };

  revalidatePath('/dashboard/my-patients');
  revalidatePath('/dashboard/queue');
  return { ok: true };
}
