import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isStaff } from '@/lib/rbac';
import { navForRole } from '@/lib/nav';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Coarse gate: unauthenticated users go to login. Patients belong in the
  // portal, not the staff dashboard. RLS enforces record-level access beyond this.
  if (!user) redirect('/login');
  if (!isStaff(user.role)) redirect('/portal');

  const items = navForRole(user.role);

  return (
    <DashboardShell items={items} user={user}>
      {children}
    </DashboardShell>
  );
}
