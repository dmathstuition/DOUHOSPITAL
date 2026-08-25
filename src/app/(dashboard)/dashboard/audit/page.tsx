import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Audit Logs' };

export default function AuditPage() {
  return (
    <ModulePlaceholder
      title="Audit Logs"
      phase="Phase 9"
      description="The append-only audit_logs table already records writes to patients, records, prescriptions, lab results and appointments (via triggers). This screen makes them searchable for super admins."
      planned={[
        'Searchable audit trail',
        'Filter by user, action, resource',
        'Record & medical access events',
        'Exports & SMS campaign events',
        'Emergency access events',
        'Read-only (immutable)',
      ]}
    />
  );
}
