import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Reports' };

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      phase="Phase 9"
      description="Operational reports with date/department/doctor filters and audited Excel export (ExcelJS). Sensitive clinical fields are excluded from ordinary exports."
      planned={[
        'Attendance & appointment reports',
        'Department & doctor reports',
        'Laboratory & pharmacy reports',
        'Registration & SMS delivery reports',
        'Filters (date, department, doctor)',
        'Audited Excel export',
      ]}
    />
  );
}
