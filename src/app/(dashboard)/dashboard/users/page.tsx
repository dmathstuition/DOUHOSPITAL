import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { UserManager } from '@/components/admin/user-manager';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listStaff } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_USERS')) redirect('/dashboard');

  const staff = await listStaff();
  return <UserManager staff={staff} currentUserId={user.id} />;
}
