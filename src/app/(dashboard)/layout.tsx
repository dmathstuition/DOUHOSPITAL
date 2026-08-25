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

  // Coarse gate: only staff use this app. Patients are records managed by
  // staff and have no login. RLS enforces record-level access beyond this.
  if (!user) redirect('/login');
  if (!isStaff(user.role)) redirect('/login');

  const items = navForRole(user.role);

  return (
    <DashboardShell items={items} user={user}>
      {children}
    </DashboardShell>
  );
}
