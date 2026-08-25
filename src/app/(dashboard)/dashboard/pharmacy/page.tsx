import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MedicationManager } from '@/components/clinical/medication-manager';
import { DispenseList } from '@/components/clinical/dispense-list';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listMedications, listPrescriptions } from '@/lib/data/clinical';

export const metadata: Metadata = { title: 'Pharmacy' };

export default async function PharmacyPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'DISPENSE_MEDICATION')) redirect('/dashboard');

  const [medications, prescriptions] = await Promise.all([
    listMedications(),
    listPrescriptions(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Pharmacy</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Awaiting Dispensing</h2>
        <DispenseList
          prescriptions={prescriptions.map((p) => ({
            id: p.id,
            patient_name: p.patient_name,
            item_count: p.item_count,
            dispense_state: p.dispense_state,
            diagnosis: p.diagnosis,
          }))}
        />
      </section>

      <MedicationManager medications={medications} />
    </div>
  );
}
