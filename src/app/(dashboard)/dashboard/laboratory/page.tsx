import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LabManager } from '@/components/clinical/lab-manager';
import { getCurrentUser } from '@/lib/auth';
import { can, isStaff } from '@/lib/rbac';
import { listLabTests } from '@/lib/data/clinical';

export const metadata: Metadata = { title: 'Laboratory' };

export default async function LaboratoryPage() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) redirect('/dashboard');

  const tests = await listLabTests();

  return <LabManager tests={tests} canRequest={can(user.role, 'REQUEST_LAB')} />;
}
