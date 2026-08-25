import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Medical Records' };

export default function RecordsPage() {
  return (
    <ModulePlaceholder
      title="Medical Records"
      phase="Phase 7"
      description="Consultations and clinical notes live in medical_records, restricted to clinical staff by RLS. Every access and change is audited."
      planned={[
        'Consultation records',
        'Symptoms, examination, diagnosis',
        'Treatment plan & doctor notes',
        'Follow-up dates',
        'Strict clinical access control',
        'Audit of record access',
      ]}
    />
  );
}
