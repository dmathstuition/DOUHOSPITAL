'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, LogIn, PlayCircle, CheckCheck, X, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppointmentStatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { CalendarDays } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { updateAppointmentStatusAction } from '@/app/(dashboard)/dashboard/appointments/actions';
import type { StaffAppointment } from '@/lib/data/appointments';
import type { AppointmentStatus } from '@/types/database';

const NEXT_ACTIONS: Record<
  AppointmentStatus,
  { status: AppointmentStatus; label: string; icon: typeof Check; variant?: 'outline' | 'ghost' | 'destructive' }[]
> = {
  pending: [
    { status: 'confirmed', label: 'Confirm', icon: Check },
    { status: 'checked_in', label: 'Check in', icon: LogIn, variant: 'outline' },
    { status: 'cancelled', label: 'Cancel', icon: X, variant: 'ghost' },
  ],
  confirmed: [
    { status: 'checked_in', label: 'Check in', icon: LogIn },
    { status: 'no_show', label: 'No show', icon: UserX, variant: 'ghost' },
    { status: 'cancelled', label: 'Cancel', icon: X, variant: 'ghost' },
  ],
  checked_in: [
    { status: 'in_consultation', label: 'Start', icon: PlayCircle },
    { status: 'cancelled', label: 'Cancel', icon: X, variant: 'ghost' },
  ],
  in_consultation: [{ status: 'completed', label: 'Complete', icon: CheckCheck }],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function AppointmentBoard({ appointments }: { appointments: StaffAppointment[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function transition(id: string, status: AppointmentStatus) {
    setPendingId(id);
    await updateAppointmentStatusAction(id, status);
    setPendingId(null);
    router.refresh();
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No appointments on this day"
        description="Choose another date or book a new appointment."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {appointments.map((a) => {
        const actions = NEXT_ACTIONS[a.status] ?? [];
        return (
          <Card key={a.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="w-16 shrink-0 text-sm font-semibold">
              {formatTime(a.start_time)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.patient_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                Dr {a.doctor_name} · {a.department_name}
                {a.reason ? ` · ${a.reason}` : ''}
              </p>
            </div>
            <AppointmentStatusBadge status={a.status} />
            <div className="flex flex-wrap gap-1.5">
              {actions.map((act) => (
                <Button
                  key={act.status}
                  size="sm"
                  variant={act.variant ?? 'default'}
                  disabled={pendingId === a.id}
                  onClick={() => transition(a.id, act.status)}
                >
                  {pendingId === a.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <act.icon />
                  )}
                  {act.label}
                </Button>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
