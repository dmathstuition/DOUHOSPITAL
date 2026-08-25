import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScheduleManager } from '@/components/admin/schedule-manager';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getDoctor, getDoctorSchedules } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Doctor Schedule' };

export default async function DoctorSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_DOCTORS')) redirect('/dashboard');

  const { id } = await params;
  const doctor = await getDoctor(id);
  if (!doctor) notFound();
  const schedules = await getDoctorSchedules(id);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/doctors"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to doctors
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dr {doctor.full_name}</h1>
        <Badge variant={doctor.status === 'active' ? 'success' : 'secondary'}>
          {doctor.status}
        </Badge>
      </div>
      <p className="text-muted-foreground">
        {doctor.specialization ?? 'General Practice'}
      </p>

      <ScheduleManager doctorId={id} schedules={schedules} />
    </div>
  );
}
