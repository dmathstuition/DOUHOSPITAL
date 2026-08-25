import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DepartmentManager } from '@/components/admin/department-manager';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listDepartments } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Departments' };

export default async function DepartmentsAdminPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_DEPARTMENTS')) redirect('/dashboard');

  const departments = await listDepartments();
  return <DepartmentManager departments={departments} />;
}
