import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <ModulePlaceholder
      title="Users"
      phase="Phase 9"
      description="User & role management for staff. Roles are stored in profiles.role and enforced server-side and in RLS; self-signup can only ever create a patient."
      planned={[
        'Invite / manage staff users',
        'Assign & change roles',
        'Activate / deactivate accounts',
        'Role-change audit',
      ]}
    />
  );
}
