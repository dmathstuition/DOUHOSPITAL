'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, PlayCircle, CheckCheck, FileText, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Stethoscope } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { advanceVisitAction } from '@/app/(dashboard)/dashboard/my-patients/actions';
import type { WorklistEntry } from '@/lib/data/worklist';

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Waiting',
  called: 'Called',
  with_nurse: 'With Nurse',
  waiting_for_doctor: 'Ready for you',
  in_consultation: 'In Consultation',
};

export function Worklist({ entries }: { entries: WorklistEntry[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function advance(id: string, status: 'in_consultation' | 'completed') {
    setPendingId(id);
    await advanceVisitAction(id, status);
    setPendingId(null);
    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No patients assigned to you"
        description="When a nurse assigns a patient to you, they appear here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {entries.map((e) => (
        <Card key={e.id} className="flex flex-wrap items-center gap-3 p-4">
          <span className="flex h-11 min-w-[3.5rem] items-center justify-center rounded-lg bg-secondary px-2 text-sm font-bold text-primary">
            {e.queue_number.replace('DOUHC-', '#')}
          </span>
          <div className="min-w-0 flex-1">
            <Link href={`/patients/${e.patient_id}`} className="font-medium hover:underline">
              {e.patient_name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {e.patient_code} · in {formatTime(e.checked_in_at.slice(11, 16))}
            </p>
          </div>
          <Badge variant={e.status === 'in_consultation' ? 'default' : 'secondary'}>
            {STATUS_LABEL[e.status] ?? e.status}
          </Badge>
          <div className="flex flex-wrap gap-1.5">
            <Button asChild variant="outline" size="sm">
              <Link href={`/patients/${e.patient_id}`}>
                <FileText /> Open
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/appointments/new?patientId=${e.patient_id}`}>
                <CalendarPlus /> Follow-up
              </Link>
            </Button>
            {e.status !== 'in_consultation' && (
              <Button
                size="sm"
                variant="outline"
                disabled={pendingId === e.id}
                onClick={() => advance(e.id, 'in_consultation')}
              >
                {pendingId === e.id ? <Loader2 className="animate-spin" /> : <PlayCircle />} Start
              </Button>
            )}
            <Button
              size="sm"
              disabled={pendingId === e.id}
              onClick={() => advance(e.id, 'completed')}
            >
              {pendingId === e.id ? <Loader2 className="animate-spin" /> : <CheckCheck />} Complete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
