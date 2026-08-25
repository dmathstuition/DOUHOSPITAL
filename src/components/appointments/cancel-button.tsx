'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cancelAppointmentAction } from '@/app/(dashboard)/dashboard/appointments/actions';

export function CancelButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setPending(true);
    setError(null);
    const res = await cancelAppointmentAction(appointmentId);
    setPending(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error ?? 'Unable to cancel.');
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <X /> Cancel
      </Button>
      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          title="Cancel appointment?"
          description="This will cancel your appointment. This action cannot be undone."
        >
          {error && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep appointment
            </Button>
            <Button variant="destructive" onClick={cancel} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Cancel appointment
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
