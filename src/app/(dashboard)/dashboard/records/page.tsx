import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listRecentRecords } from '@/lib/data/clinical';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Medical Records' };

export default async function RecordsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'VIEW_CLINICAL_NOTES')) redirect('/dashboard');

  const records = await listRecentRecords();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
        <p className="text-muted-foreground">Recent consultations · create from a patient profile</p>
      </div>

      {records.length === 0 ? (
        <EmptyState icon={FileText} title="No consultations recorded yet" />
      ) : (
        <div className="grid gap-3">
          {records.map((r) => (
            <Link key={r.id} href={`/patients/${r.patient_id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.patient_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.diagnosis ?? 'Consultation'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
