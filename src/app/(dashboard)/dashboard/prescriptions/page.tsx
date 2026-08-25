import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Pill, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { getCurrentUser } from '@/lib/auth';
import { can, isStaff } from '@/lib/rbac';
import { listPrescriptions } from '@/lib/data/clinical';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Prescriptions' };

export default async function PrescriptionsPage() {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) redirect('/dashboard');

  const prescriptions = await listPrescriptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Prescriptions</h1>
        {can(user.role, 'CREATE_PRESCRIPTION') && (
          <Button asChild>
            <Link href="/dashboard/prescriptions/new">
              <Plus /> New Prescription
            </Link>
          </Button>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState icon={Pill} title="No prescriptions yet" />
      ) : (
        <div className="grid gap-3">
          {prescriptions.map((p) => (
            <Link key={p.id} href={`/dashboard/prescriptions/${p.id}`}>
              <Card className="flex flex-wrap items-center gap-3 p-4 transition-shadow hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Pill className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.patient_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.diagnosis ?? 'No diagnosis'} · {p.item_count} item
                    {p.item_count === 1 ? '' : 's'} · {formatDate(p.created_at)}
                  </p>
                </div>
                <Badge variant={p.status === 'active' ? 'default' : 'success'}>{p.status}</Badge>
                <Badge
                  variant={
                    p.dispense_state === 'dispensed'
                      ? 'success'
                      : p.dispense_state === 'partial'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {p.dispense_state}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
