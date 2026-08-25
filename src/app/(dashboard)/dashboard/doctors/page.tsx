import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DoctorManager } from '@/components/admin/doctor-manager';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listDoctorsAdmin, listActiveDepartments } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Doctors' };

export default async function DoctorsAdminPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_DOCTORS')) redirect('/dashboard');

  const [doctors, departments] = await Promise.all([
    listDoctorsAdmin(),
    listActiveDepartments(),
  ]);

  return <DoctorManager doctors={doctors} departments={departments} />;
}
