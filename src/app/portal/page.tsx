import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus, CalendarDays, Pill, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { AppointmentStatusBadge } from '@/components/shared/status-badge';
import { CancelButton } from '@/components/appointments/cancel-button';
import { getCurrentUser } from '@/lib/auth';
import {
  getMyPatientRecord,
  getMyAppointments,
  getMyPrescriptions,
} from '@/lib/data/portal';
import { formatDate, formatTime } from '@/lib/utils';
import type { AppointmentStatus } from '@/types/database';

export const metadata: Metadata = { title: 'My Portal' };

export default async function PortalHome() {
  const user = await getCurrentUser();
  const patient = await getMyPatientRecord();

  const [appointments, prescriptions] = patient
    ? await Promise.all([getMyAppointments(patient.id), getMyPrescriptions(patient.id)])
    : [[], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground">Manage your appointments and health information.</p>
      </div>

      {!patient && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Your patient record isn&apos;t linked yet</p>
              <p className="text-muted-foreground">
                Visit the health center reception to complete your registration and
                link your account. You can still browse services and contact us.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Button asChild size="lg" className="justify-start">
          <Link href="/portal/appointments/new"><CalendarPlus /> Book Appointment</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="justify-start">
          <Link href="/portal#appointments"><CalendarDays /> My Appointments</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="justify-start">
          <Link href="/portal#prescriptions"><Pill /> My Prescriptions</Link>
        </Button>
      </div>

      <Card id="appointments">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> My Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments yet" />
          ) : (
            <ul className="divide-y">
              {appointments.map((a) => {
                const cancellable =
                  a.status === 'pending' || a.status === 'confirmed';
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(a.appointment_date)} · {formatTime(a.start_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.reason ?? 'General consultation'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                      {cancellable && <CancelButton appointmentId={a.id} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card id="prescriptions">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Pill className="h-4 w-4 text-primary" /> My Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <EmptyState icon={FileText} title="No prescriptions available" />
          ) : (
            <ul className="divide-y">
              {prescriptions.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.diagnosis ?? 'Prescription'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                    {p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
