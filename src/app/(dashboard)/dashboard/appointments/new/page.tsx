import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { StaffBooking } from '@/components/appointments/staff-booking';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listActiveDepartments } from '@/lib/data/admin';
import { getPatient } from '@/lib/data/patients';

export const metadata: Metadata = { title: 'New Appointment' };

export default async function StaffNewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_APPOINTMENTS')) redirect('/dashboard');

  const { patientId } = await searchParams;
  const [departments, patient] = await Promise.all([
    listActiveDepartments(),
    patientId ? getPatient(patientId) : Promise.resolve(null),
  ]);

  const initialPatient = patient
    ? {
        id: patient.id,
        name: `${patient.last_name}, ${patient.first_name}`,
        code: patient.patient_code,
        matric: patient.matric_number,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to appointments
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Appointment</h1>
        <p className="text-muted-foreground">
          Book on behalf of a patient. Select the patient, then choose a slot.
        </p>
      </div>
      <StaffBooking departments={departments} initialPatient={initialPatient} />
    </div>
  );
}
