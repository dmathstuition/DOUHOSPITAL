import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Worklist } from '@/components/clinical/worklist';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { getMyDoctorId, getDoctorWorklist } from '@/lib/data/worklist';

export const metadata: Metadata = { title: 'My Patients' };

export default async function MyPatientsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== ROLES.DOCTOR && user.role !== ROLES.SUPER_ADMIN) {
    redirect('/dashboard');
  }

  const doctorId = await getMyDoctorId();
  const entries = doctorId ? await getDoctorWorklist(doctorId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Patients</h1>
        <p className="text-muted-foreground">Patients assigned to you today</p>
      </div>

      {!doctorId && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Your account isn&apos;t linked to a doctor profile</p>
              <p className="text-muted-foreground">
                Ask an administrator to link your staff account to a doctor record
                so assigned patients appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Worklist entries={entries} />
    </div>
  );
}
