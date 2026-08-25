import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Appointments' };

export default function AppointmentsAdminPage() {
  return (
    <ModulePlaceholder
      title="Appointments"
      phase="Phase 5"
      description="Slot generation, booking, calendar views and check-in build on the appointments schema and double-booking constraints already in the database."
      planned={[
        'Daily / weekly / monthly calendar',
        'Slot generation from doctor schedules',
        'Create, confirm, reschedule, cancel',
        'Check-in and status transitions',
        'Confirmation SMS + email on booking',
        'No-show handling',
      ]}
    />
  );
}
