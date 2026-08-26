'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { deletePatientAction } from '@/app/(dashboard)/patients/actions';

export function PatientActions({
  patientId,
  patientName,
  canEdit,
  canDelete,
}: {
  patientId: string;
  patientName: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    const res = await deletePatientAction(patientId);
    setPending(false);
    if (res.ok) {
      router.push('/patients');
      router.refresh();
    } else {
      setError(res.error ?? 'Unable to delete.');
    }
  }

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/patients/${patientId}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      )}
      {canDelete && (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Trash2 /> Delete
        </Button>
      )}

      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          title="Delete patient?"
          description={`This removes ${patientName} from the patient lists. Their past appointments and records are preserved, not shown here.`}
        >
          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Delete patient
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
