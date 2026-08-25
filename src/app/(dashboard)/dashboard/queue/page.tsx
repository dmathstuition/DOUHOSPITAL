import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Waiting Queue' };

export default function QueuePage() {
  return (
    <ModulePlaceholder
      title="Waiting Queue"
      phase="Phase 6"
      description="The waiting_queue table generates DOUHC-001 style numbers per day (with a race-safe trigger). The live queue board and nurse/doctor workflows build on it."
      planned={[
        'Check-in with auto queue numbers',
        'Current / next / waiting counts',
        'Call next, recall, move patient',
        'Nurse and doctor workflows',
        'Average waiting time',
        'Complete visit',
      ]}
    />
  );
}
