import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { StaffBooking } from '@/components/appointments/staff-booking';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listActiveDepartments } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'New Appointment' };

export default async function StaffNewAppointmentPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_APPOINTMENTS')) redirect('/dashboard');

  const departments = await listActiveDepartments();

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
      <StaffBooking departments={departments} />
    </div>
  );
}
