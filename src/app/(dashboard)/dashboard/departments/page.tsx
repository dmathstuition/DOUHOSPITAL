import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Departments' };

export default function DepartmentsAdminPage() {
  return (
    <ModulePlaceholder
      title="Departments"
      phase="Phase 4"
      description="Departments are seeded and shown publicly. Admin management uses the departments table with soft deactivation to preserve historical records."
      planned={[
        'Create / edit departments',
        'Deactivate (never hard-delete)',
        'Location, phone, opening hours',
        'Status management',
      ]}
    />
  );
}
