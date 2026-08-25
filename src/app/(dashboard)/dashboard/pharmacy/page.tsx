import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Pharmacy' };

export default function PharmacyPage() {
  return (
    <ModulePlaceholder
      title="Pharmacy"
      phase="Phase 7"
      description="Medication inventory lives in the medications table with reorder levels and expiry tracking; dispensing links to prescriptions."
      planned={[
        'View & dispense prescriptions',
        'Partial / full dispense',
        'Medication inventory',
        'Low-stock alerts',
        'Expiry alerts',
        'Batch, supplier, price',
      ]}
    />
  );
}
