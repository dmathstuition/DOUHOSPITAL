import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { BookingWizard } from '@/components/appointments/booking-wizard';
import { listActiveDepartments } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Book Appointment' };

export default async function PortalBookingPage() {
  const departments = await listActiveDepartments();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to portal
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Book an Appointment</h1>
      </div>
      <BookingWizard departments={departments} redirectTo="/portal" />
    </div>
  );
}
