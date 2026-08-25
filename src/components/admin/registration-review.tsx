'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, UserPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Inbox } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatNigerianPhone } from '@/lib/utils/phone';
import {
  approveRegistrationAction,
  rejectRegistrationAction,
} from '@/app/(dashboard)/dashboard/registrations/actions';
import type { RegistrationRequestRow } from '@/types/database';

export function RegistrationReview({ requests }: { requests: RegistrationRequestRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setPendingId(id);
    setError(null);
    const res = await approveRegistrationAction(id);
    setPendingId(null);
    if (res.ok && res.patientId) {
      router.push(`/patients/${res.patientId}`);
      router.refresh();
    } else {
      setError(res.error ?? 'Unable to approve.');
    }
  }

  async function reject(id: string) {
    setPendingId(id);
    setError(null);
    await rejectRegistrationAction(id);
    setPendingId(null);
    router.refresh();
  }

  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title="No registration requests" />;
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {requests.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {r.first_name} {r.middle_name ?? ''} {r.last_name}
                </p>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted {formatDate(r.created_at)}
                {r.matric_number ? ` · ${r.matric_number}` : ''}
                {r.phone ? ` · ${formatNigerianPhone(r.phone)}` : ''}
                {r.email ? ` · ${r.email}` : ''}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[r.faculty, r.department, r.level && `Level ${r.level}`]
                  .filter(Boolean)
                  .join(' · ') || 'No student details provided'}
              </p>
              {r.note && (
                <p className="mt-1 text-xs italic text-muted-foreground">“{r.note}”</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {r.status === 'pending' ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => approve(r.id)}
                    disabled={pendingId === r.id}
                  >
                    {pendingId === r.id ? <Loader2 className="animate-spin" /> : <Check />}
                    Approve &amp; register
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reject(r.id)}
                    disabled={pendingId === r.id}
                  >
                    <X /> Reject
                  </Button>
                </>
              ) : r.status === 'approved' && r.patient_id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/patients/${r.patient_id}`}>
                    <UserPlus /> View patient <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: RegistrationRequestRow['status'] }) {
  if (status === 'approved') return <Badge variant="success">Approved</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}
