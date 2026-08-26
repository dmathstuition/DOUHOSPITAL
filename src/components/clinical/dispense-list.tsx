'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Pill } from 'lucide-react';
import { dispensePrescriptionAction } from '@/app/(dashboard)/dashboard/pharmacy/actions';

export interface DispenseItem {
  id: string;
  patient_name: string;
  item_count: number;
  dispense_state: 'pending' | 'partial' | 'dispensed';
  diagnosis: string | null;
}

export function DispenseList({ prescriptions }: { prescriptions: DispenseItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const pending = prescriptions.filter((p) => p.dispense_state !== 'dispensed');

  async function dispense(id: string, mode: 'partial' | 'full') {
    setPendingId(id);
    await dispensePrescriptionAction(id, mode);
    setPendingId(null);
    router.refresh();
  }

  if (pending.length === 0) {
    return <EmptyState icon={PackageCheck} title="Nothing awaiting dispensing" />;
  }

  return (
    <div className="grid gap-2">
      {pending.map((p) => (
        <Card key={p.id} className="flex flex-wrap items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Pill className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <Link href={`/dashboard/prescriptions/${p.id}`} className="font-medium hover:underline">
              {p.patient_name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {p.diagnosis ?? 'No diagnosis'} · {p.item_count} item{p.item_count === 1 ? '' : 's'}
            </p>
          </div>
          <Badge variant={p.dispense_state === 'partial' ? 'warning' : 'secondary'}>
            {p.dispense_state}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pendingId === p.id}
              onClick={() => dispense(p.id, 'partial')}
            >
              {pendingId === p.id ? <Loader2 className="animate-spin" /> : null} Partial
            </Button>
            <Button
              size="sm"
              disabled={pendingId === p.id}
              onClick={() => dispense(p.id, 'full')}
            >
              {pendingId === p.id ? <Loader2 className="animate-spin" /> : <PackageCheck />} Dispense
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
