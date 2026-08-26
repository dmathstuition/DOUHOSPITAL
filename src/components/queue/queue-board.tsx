'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  UserPlus,
  PhoneCall,
  Stethoscope,
  UserCheck,
  PlayCircle,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/empty-state';
import { ListOrdered } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { searchPatientsAction } from '@/app/(dashboard)/patients/actions';
import { checkInAction, updateQueueStatusAction } from '@/app/(dashboard)/dashboard/queue/actions';
import type { QueueEntry } from '@/lib/data/queue';
import type { WaitingQueueRow } from '@/types/database';

type QStatus = WaitingQueueRow['status'];

const STATUS_LABEL: Record<QStatus, string> = {
  waiting: 'Waiting',
  called: 'Called',
  with_nurse: 'With Nurse',
  waiting_for_doctor: 'Waiting for Doctor',
  in_consultation: 'In Consultation',
  completed: 'Completed',
};

const STATUS_VARIANT: Record<QStatus, 'default' | 'secondary' | 'success' | 'warning'> = {
  waiting: 'warning',
  called: 'default',
  with_nurse: 'secondary',
  waiting_for_doctor: 'secondary',
  in_consultation: 'default',
  completed: 'success',
};

const ACTIONS: Record<QStatus, { status: QStatus; label: string; icon: typeof PhoneCall; variant?: 'outline' | 'ghost' }[]> = {
  waiting: [{ status: 'called', label: 'Call', icon: PhoneCall }],
  called: [
    { status: 'with_nurse', label: 'With nurse', icon: UserCheck },
    { status: 'waiting', label: 'Recall later', icon: RotateCcw, variant: 'ghost' },
  ],
  with_nurse: [{ status: 'waiting_for_doctor', label: 'To doctor', icon: Stethoscope }],
  waiting_for_doctor: [{ status: 'in_consultation', label: 'Start', icon: PlayCircle }],
  in_consultation: [{ status: 'completed', label: 'Complete', icon: CheckCheck }],
  completed: [],
};

interface DoctorOption {
  id: string;
  full_name: string;
}

export function QueueBoard({
  entries,
  doctors,
}: {
  entries: QueueEntry[];
  doctors: DoctorOption[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const active = entries.filter((e) => e.status !== 'completed');
  const completed = entries.filter((e) => e.status === 'completed');

  async function transition(id: string, status: QStatus) {
    setPendingId(id);
    await updateQueueStatusAction(id, status);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Today&apos;s Queue</h2>
        <Button onClick={() => setCheckInOpen(true)}>
          <UserPlus /> Check In Patient
        </Button>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No one is waiting"
          description="Check a patient in to add them to the queue."
        />
      ) : (
        <div className="grid gap-3">
          {active.map((e) => (
            <Card key={e.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-11 min-w-[3.5rem] items-center justify-center rounded-lg bg-secondary px-2 text-sm font-bold text-primary">
                {e.queue_number.replace('DOUHC-', '#')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {e.patient_code} · in {formatTime(e.checked_in_at.slice(11, 16))}
                  {e.doctor_name ? ` · Dr ${e.doctor_name}` : ' · Unassigned'}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge>
              <div className="flex flex-wrap gap-1.5">
                {ACTIONS[e.status].map((a) => (
                  <Button
                    key={a.status + a.label}
                    size="sm"
                    variant={a.variant ?? 'default'}
                    disabled={pendingId === e.id}
                    onClick={() => transition(e.id, a.status)}
                  >
                    {pendingId === e.id ? <Loader2 className="animate-spin" /> : <a.icon />}
                    {a.label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Completed today ({completed.length})
          </h3>
          <div className="grid gap-2">
            {completed.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-2 text-sm"
              >
                <span className="font-semibold text-muted-foreground">
                  {e.queue_number.replace('DOUHC-', '#')}
                </span>
                <span className="flex-1">{e.patient_name}</span>
                <Badge variant="success">Completed</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {checkInOpen && (
        <CheckInDialog
          doctors={doctors}
          onClose={() => setCheckInOpen(false)}
          onDone={() => {
            setCheckInOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CheckInDialog({
  doctors,
  onClose,
  onDone,
}: {
  doctors: DoctorOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; code: string; matric: string | null }[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(async () => {
      setResults(await searchPatientsAction(query.trim()));
    });
  }

  function checkIn(patientId: string) {
    setError(null);
    startTransition(async () => {
      const res = await checkInAction(patientId, doctorId || undefined);
      if (res.ok) {
        setSuccess(`Checked in as ${res.queueNumber}`);
        setTimeout(onDone, 800);
      } else {
        setError(res.error ?? 'Unable to check in.');
      }
    });
  }

  return (
    <Dialog open onClose={onClose} title="Check in a patient" description="Search for the patient, assign a doctor, and add them to the queue.">
      {success ? (
        <p className="rounded-md bg-success/10 px-3 py-3 text-center text-sm font-medium text-success">
          {success}
        </p>
      ) : (
        <>
          <div className="mb-4 space-y-2">
            <Label>Assign to doctor</Label>
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr {d.full_name}</option>
              ))}
            </Select>
          </div>
          <form onSubmit={search} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, matric, phone or patient ID"
                className="pl-9"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : 'Search'}
            </Button>
          </form>

          {error && (
            <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-4 grid gap-2">
            {results.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.code}
                    {p.matric ? ` · ${p.matric}` : ''}
                  </p>
                </div>
                <Button size="sm" onClick={() => checkIn(p.id)} disabled={isPending}>
                  Check in
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}
