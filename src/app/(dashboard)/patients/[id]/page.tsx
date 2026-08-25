import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  AlertTriangle,
  Activity,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Droplet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { AppointmentStatusBadge } from '@/components/shared/status-badge';
import {
  getPatient,
  getPatientVitals,
  getPatientAppointments,
  getPatientAlerts,
} from '@/lib/data/patients';
import { calculateAge, formatDate, formatTime, initials } from '@/lib/utils';
import { formatNigerianPhone } from '@/lib/utils/phone';
import type { AppointmentStatus } from '@/types/database';

export const metadata: Metadata = { title: 'Patient Profile' };

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const [vitals, appointments, alerts] = await Promise.all([
    getPatientVitals(id),
    getPatientAppointments(id),
    getPatientAlerts(id),
  ]);

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to patients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-primary">
          {initials(patient.first_name, patient.last_name)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {patient.first_name} {patient.middle_name ?? ''} {patient.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {patient.patient_code}
            {patient.matric_number ? ` · ${patient.matric_number}` : ''}
            {age !== null ? ` · ${age} yrs` : ''}
            {patient.sex ? ` · ${patient.sex}` : ''}
          </p>
        </div>
        <Badge
          variant={patient.status === 'active' ? 'success' : 'secondary'}
          className="ml-auto"
        >
          {patient.status}
        </Badge>
      </div>

      {/* Medical alerts (prominent) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold capitalize">
                  {a.alert_type.replace('_', ' ')}:
                </span>{' '}
                {a.description}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Droplet} label="Blood group" value={patient.blood_group} />
            <Row label="Genotype" value={patient.genotype} />
            <Row icon={Phone} label="Phone" value={patient.phone ? formatNigerianPhone(patient.phone) : null} />
            <Row icon={Mail} label="Email" value={patient.email} />
            <Row icon={MapPin} label="Address" value={patient.address} />
            <Row label="Faculty" value={patient.faculty} />
            <Row label="Department" value={patient.department} />
            <Row label="Level" value={patient.level} />
            <Row label="Registered" value={formatDate(patient.registration_date)} />
            <div className="border-t pt-3">
              <p className="font-medium">Emergency contact</p>
              <p className="text-muted-foreground">
                {patient.emergency_contact_name ?? '—'}
                {patient.emergency_contact_phone
                  ? ` · ${formatNigerianPhone(patient.emergency_contact_phone)}`
                  : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Vital signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" /> Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vitals.length === 0 ? (
                <EmptyState icon={Activity} title="No vital signs recorded" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Date</th>
                        <th className="py-2 pr-4 font-medium">BP</th>
                        <th className="py-2 pr-4 font-medium">Temp</th>
                        <th className="py-2 pr-4 font-medium">Pulse</th>
                        <th className="py-2 pr-4 font-medium">SpO₂</th>
                        <th className="py-2 pr-4 font-medium">BMI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitals.map((v) => (
                        <tr key={v.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{formatDate(v.recorded_at)}</td>
                          <td className="py-2 pr-4">{v.blood_pressure ?? '—'}</td>
                          <td className="py-2 pr-4">{v.temperature ?? '—'}</td>
                          <td className="py-2 pr-4">{v.pulse ?? '—'}</td>
                          <td className="py-2 pr-4">{v.oxygen_saturation ?? '—'}</td>
                          <td className="py-2 pr-4">{v.bmi ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" /> Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No appointments yet" />
              ) : (
                <ul className="divide-y">
                  {appointments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(a.appointment_date)} · {formatTime(a.start_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.reason ?? 'General consultation'}
                        </p>
                      </div>
                      <AppointmentStatusBadge status={a.status as AppointmentStatus} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Phone;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  );
}
