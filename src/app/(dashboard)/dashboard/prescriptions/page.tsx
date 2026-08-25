import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Prescriptions' };

export default function PrescriptionsPage() {
  return (
    <ModulePlaceholder
      title="Prescriptions"
      phase="Phase 7"
      description="Prescriptions and their items are modelled in prescriptions / prescription_items, with dispensing state tracked for pharmacy."
      planned={[
        'Create prescriptions (doctors)',
        'Medication, dosage, frequency, duration',
        'Route & instructions',
        'Printable prescription',
        'Dispensing status',
      ]}
    />
  );
}
