import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Laboratory' };

export default function LaboratoryPage() {
  return (
    <ModulePlaceholder
      title="Laboratory"
      phase="Phase 7"
      description="Lab requests and results use laboratory_tests / laboratory_results. Result files are stored in a private bucket and served only via signed URLs."
      planned={[
        'Doctor test requests',
        'Status: requested → reviewed',
        'Secure result file upload (PDF/JPG/PNG)',
        'Reference range & interpretation',
        'Private storage + signed URLs',
        'Result-ready notifications',
      ]}
    />
  );
}
