'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import type { WaitingQueueRow } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
  queueNumber?: string;
}

async function authorize() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: 'Your session has expired. Please sign in again.' };
  if (!can(user.role, 'MANAGE_QUEUE')) {
    return { user: null, error: 'You are not authorized to manage the queue.' };
  }
  return { user, error: null };
}

/**
 * Check a patient in. The queue number (DOUHC-001…) is assigned by a
 * race-safe database trigger, so concurrent check-ins never collide.
 * Guards against checking the same patient in twice while still active.
 */
export async function checkInAction(patientId: string): Promise<ActionResult> {
  const { user, error } = await authorize();
  if (error || !user) return { ok: false, error: error ?? 'Not authorized.' };

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('waiting_queue')
    .select('id, status')
    .eq('patient_id', patientId)
    .gte('checked_in_at', `${today}T00:00:00`)
    .neq('status', 'completed')
    .maybeSingle<{ id: string; status: string }>();

  if (existing) {
    return { ok: false, error: 'This patient is already in today’s queue.' };
  }

  const { data, error: insertError } = await supabase
    .from('waiting_queue')
    .insert({ patient_id: patientId, status: 'waiting', created_by: user.id })
    .select('queue_number')
    .single();

  if (insertError) return { ok: false, error: 'Unable to check the patient in.' };

  revalidatePath('/dashboard/queue');
  return { ok: true, queueNumber: data.queue_number };
}

/** Advance a queue entry to a new status (staff only). */
export async function updateQueueStatusAction(
  id: string,
  status: WaitingQueueRow['status'],
): Promise<ActionResult> {
  const { error } = await authorize();
  if (error) return { ok: false, error };

  const supabase = await createClient();
  const patch: Partial<WaitingQueueRow> = { status };
  if (status === 'completed') patch.completed_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('waiting_queue')
    .update(patch)
    .eq('id', id);
  if (updateError) return { ok: false, error: 'Unable to update the queue entry.' };

  revalidatePath('/dashboard/queue');
  return { ok: true };
}
