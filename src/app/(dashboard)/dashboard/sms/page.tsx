import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SmsCampaign } from '@/components/admin/sms-campaign';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listFaculties, listPatientDepartments } from '@/lib/data/sms';

export const metadata: Metadata = { title: 'SMS Campaigns' };

export default async function SmsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'SEND_BULK_SMS')) redirect('/dashboard');

  const [departments, faculties] = await Promise.all([
    listPatientDepartments(),
    listFaculties(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SMS Campaigns</h1>
        <p className="text-muted-foreground">
          Send bulk SMS to patients. Delivery runs through Termii via the
          notification engine; each recipient is logged.
        </p>
      </div>
      <SmsCampaign departments={departments} faculties={faculties} />
    </div>
  );
}
