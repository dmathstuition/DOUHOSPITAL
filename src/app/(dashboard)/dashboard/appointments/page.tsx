import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentBoard } from '@/components/appointments/appointment-board';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listAppointmentsByDate } from '@/lib/data/appointments';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Appointments' };

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function AppointmentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_APPOINTMENTS')) redirect('/dashboard');

  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;

  const appointments = await listAppointmentsByDate(date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">{formatDate(date)}</p>
        </div>
        {can(user.role, 'REGISTER_PATIENT') && (
          <Button asChild>
            <Link href="/dashboard/appointments/new">
              <CalendarPlus /> New Appointment
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/appointments?date=${shiftDate(date, -1)}`}>
            <ChevronLeft /> Previous
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/appointments">Today</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/appointments?date=${shiftDate(date, 1)}`}>
            Next <ChevronRight />
          </Link>
        </Button>
      </div>

      <AppointmentBoard appointments={appointments} />
    </div>
  );
}
