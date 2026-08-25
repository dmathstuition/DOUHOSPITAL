'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Stethoscope, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { recordVitalsAction, createConsultationAction } from '@/app/(dashboard)/dashboard/records/actions';

/** Clinical quick-actions shown on a patient profile, gated by role. */
export function PatientClinicalActions({
  patientId,
  canVitals,
  canConsult,
}: {
  patientId: string;
  canVitals: boolean;
  canConsult: boolean;
}) {
  const [open, setOpen] = useState<null | 'vitals' | 'consult'>(null);

  if (!canVitals && !canConsult) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canVitals && (
        <Button variant="outline" size="sm" onClick={() => setOpen('vitals')}>
          <Activity /> Record Vitals
        </Button>
      )}
      {canConsult && (
        <Button variant="outline" size="sm" onClick={() => setOpen('consult')}>
          <Stethoscope /> New Consultation
        </Button>
      )}

      {open === 'vitals' && (
        <VitalsDialog patientId={patientId} onClose={() => setOpen(null)} />
      )}
      {open === 'consult' && (
        <ConsultationDialog patientId={patientId} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function VitalsDialog({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await recordVitalsAction({
      patient_id: patientId,
      blood_pressure: String(fd.get('blood_pressure') ?? ''),
      temperature: fd.get('temperature') as unknown as number,
      weight: fd.get('weight') as unknown as number,
      height: fd.get('height') as unknown as number,
      pulse: fd.get('pulse') as unknown as number,
      respiratory_rate: fd.get('respiratory_rate') as unknown as number,
      oxygen_saturation: fd.get('oxygen_saturation') as unknown as number,
    });
    setPending(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else setError(res.error ?? 'Unable to record vitals.');
  }

  return (
    <Dialog open onClose={onClose} title="Record vital signs">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Blood pressure</Label><Input name="blood_pressure" placeholder="120/80" /></div>
          <div className="space-y-2"><Label>Temperature (°C)</Label><Input name="temperature" type="number" step="0.1" /></div>
          <div className="space-y-2"><Label>Weight (kg)</Label><Input name="weight" type="number" step="0.1" /></div>
          <div className="space-y-2"><Label>Height (cm)</Label><Input name="height" type="number" step="0.1" /></div>
          <div className="space-y-2"><Label>Pulse (bpm)</Label><Input name="pulse" type="number" /></div>
          <div className="space-y-2"><Label>Resp. rate</Label><Input name="respiratory_rate" type="number" /></div>
          <div className="space-y-2"><Label>SpO₂ (%)</Label><Input name="oxygen_saturation" type="number" /></div>
        </div>
        <p className="text-xs text-muted-foreground">BMI is calculated automatically from weight and height.</p>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save</Button>
        </div>
      </form>
    </Dialog>
  );
}

function ConsultationDialog({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createConsultationAction({
      patient_id: patientId,
      symptoms: String(fd.get('symptoms') ?? ''),
      examination: String(fd.get('examination') ?? ''),
      diagnosis: String(fd.get('diagnosis') ?? ''),
      treatment_plan: String(fd.get('treatment_plan') ?? ''),
      doctor_notes: String(fd.get('doctor_notes') ?? ''),
      follow_up_date: String(fd.get('follow_up_date') ?? ''),
    });
    setPending(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else setError(res.error ?? 'Unable to save consultation.');
  }

  const ta =
    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <Dialog open onClose={onClose} title="New consultation">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label>Symptoms</Label><textarea name="symptoms" rows={2} className={ta} /></div>
        <div className="space-y-2"><Label>Examination</Label><textarea name="examination" rows={2} className={ta} /></div>
        <div className="space-y-2"><Label>Diagnosis</Label><textarea name="diagnosis" rows={2} className={ta} /></div>
        <div className="space-y-2"><Label>Treatment plan</Label><textarea name="treatment_plan" rows={2} className={ta} /></div>
        <div className="space-y-2"><Label>Doctor notes (confidential)</Label><textarea name="doctor_notes" rows={2} className={ta} /></div>
        <div className="space-y-2"><Label>Follow-up date</Label><Input name="follow_up_date" type="date" /></div>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Save consultation</Button>
        </div>
      </form>
    </Dialog>
  );
}
