import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WaitingQueueRow } from '@/types/database';

export interface QueueEntry {
  id: string;
  queue_number: string;
  status: WaitingQueueRow['status'];
  checked_in_at: string;
  completed_at: string | null;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  doctor_name: string | null;
}

const ACTIVE_STATUSES: WaitingQueueRow['status'][] = [
  'waiting',
  'called',
  'with_nurse',
  'waiting_for_doctor',
  'in_consultation',
];

/** Today's queue entries with patient names, oldest check-in first. */
export async function getTodayQueue(): Promise<QueueEntry[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from('waiting_queue')
    .select(
      `id, queue_number, status, checked_in_at, completed_at, patient_id,
       patients:patient_id ( first_name, last_name, patient_code ),
       doctors:assigned_doctor_id ( full_name )`,
    )
    .gte('checked_in_at', `${today}T00:00:00`)
    .order('checked_in_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((q) => ({
    id: q.id,
    queue_number: q.queue_number,
    status: q.status,
    checked_in_at: q.checked_in_at,
    completed_at: q.completed_at,
    patient_id: q.patient_id,
    patient_name: q.patients
      ? `${q.patients.first_name} ${q.patients.last_name}`
      : 'Unknown',
    patient_code: q.patients?.patient_code ?? '—',
    doctor_name: q.doctors?.full_name ?? null,
  }));
}

export interface QueueStats {
  waiting: number;
  inProgress: number;
  completed: number;
  current: QueueEntry | null;
  next: QueueEntry | null;
  avgWaitMinutes: number | null;
}

/** Derive queue dashboard statistics from today's entries. */
export function computeQueueStats(entries: QueueEntry[]): QueueStats {
  const waiting = entries.filter((e) => e.status === 'waiting').length;
  const inProgress = entries.filter(
    (e) => e.status !== 'waiting' && e.status !== 'completed',
  ).length;
  const completedEntries = entries.filter((e) => e.status === 'completed');

  const active = entries.filter((e) => ACTIVE_STATUSES.includes(e.status));
  const current =
    active.find((e) => e.status === 'in_consultation') ??
    active.find((e) => e.status !== 'waiting') ??
    null;
  const next = entries.find((e) => e.status === 'waiting') ?? null;

  // Average wait: check-in → completion for completed entries today.
  let avgWaitMinutes: number | null = null;
  const durations = completedEntries
    .filter((e) => e.completed_at)
    .map(
      (e) =>
        (new Date(e.completed_at as string).getTime() -
          new Date(e.checked_in_at).getTime()) /
        60000,
    )
    .filter((m) => m >= 0);
  if (durations.length > 0) {
    avgWaitMinutes = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length,
    );
  }

  return {
    waiting,
    inProgress,
    completed: completedEntries.length,
    current,
    next,
    avgWaitMinutes,
  };
}
