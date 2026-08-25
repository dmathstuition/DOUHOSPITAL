'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Stethoscope,
  CalendarDays,
  Clock,
  ClipboardList,
  CheckCircle2,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, formatDate, formatTime } from '@/lib/utils';
import type { Slot } from '@/lib/appointments/slots';
import {
  fetchDoctorsAction,
  fetchSlotsAction,
  createAppointmentAction,
} from '@/app/(dashboard)/dashboard/appointments/actions';

interface Dept {
  id: string;
  name: string;
}
interface Doc {
  id: string;
  full_name: string;
  specialization: string | null;
}

type Step = 'department' | 'doctor' | 'date' | 'time' | 'reason' | 'review' | 'done';

const STEP_ORDER: Step[] = ['department', 'doctor', 'date', 'time', 'reason', 'review'];

export function BookingWizard({
  departments,
  redirectTo = '/dashboard/appointments',
  patientId,
}: {
  departments: Dept[];
  redirectTo?: string;
  /** When set (staff booking on behalf), the appointment is booked for this patient. */
  patientId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('department');
  const [isPending, startTransition] = useTransition();

  const [dept, setDept] = useState<Dept | null>(null);
  const [doctors, setDoctors] = useState<Doc[]>([]);
  const [doctor, setDoctor] = useState<Doc | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function chooseDept(d: Dept) {
    setDept(d);
    setDoctor(null);
    setLoadingList(true);
    startTransition(async () => {
      const docs = await fetchDoctorsAction(d.id);
      setDoctors(docs);
      setLoadingList(false);
      setStep('doctor');
    });
  }

  function chooseDoctor(d: Doc) {
    setDoctor(d);
    setSlot(null);
    setStep('date');
  }

  function chooseDate(value: string) {
    setDate(value);
    setSlot(null);
    if (!value || !doctor) return;
    setLoadingList(true);
    startTransition(async () => {
      const s = await fetchSlotsAction(doctor.id, value);
      setSlots(s);
      setLoadingList(false);
      setStep('time');
    });
  }

  function confirm() {
    if (!dept || !doctor || !date || !slot) return;
    setError(null);
    startTransition(async () => {
      const res = await createAppointmentAction({
        department_id: dept.id,
        doctor_id: doctor.id,
        appointment_date: date,
        start_time: slot.start,
        reason,
        patient_id: patientId,
      });
      if (res.ok) {
        setStep('done');
        router.refresh();
      } else {
        setError(res.error ?? 'Unable to book the appointment.');
      }
    });
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  if (step === 'done') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="h-14 w-14 text-success" />
          <h2 className="mt-4 text-xl font-semibold">Appointment booked</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your appointment with Dr {doctor?.full_name} on {formatDate(date)} at{' '}
            {formatTime(slot?.start ?? null)} has been booked. You&apos;ll receive an SMS
            and email confirmation.
          </p>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => router.push(redirectTo)}>Done</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEP_ORDER.map((s, i) => (
          <li
            key={s}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 capitalize',
              i === stepIndex
                ? 'border-primary bg-primary text-primary-foreground'
                : i < stepIndex
                  ? 'border-primary/30 bg-secondary text-primary'
                  : 'text-muted-foreground',
            )}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {stepIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep(STEP_ORDER[stepIndex - 1])}
        >
          <ChevronLeft /> Back
        </Button>
      )}

      {step === 'department' && (
        <StepShell icon={Building2} title="Choose a department">
          <div className="grid gap-2 sm:grid-cols-2">
            {departments.map((d) => (
              <Button
                key={d.id}
                variant="outline"
                className="justify-start"
                onClick={() => chooseDept(d)}
              >
                {d.name}
              </Button>
            ))}
          </div>
        </StepShell>
      )}

      {step === 'doctor' && (
        <StepShell icon={Stethoscope} title="Choose a doctor">
          {loadingList ? (
            <Loading />
          ) : doctors.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No doctors available in this department" />
          ) : (
            <div className="grid gap-2">
              {doctors.map((d) => (
                <Button
                  key={d.id}
                  variant="outline"
                  className="h-auto justify-start py-3"
                  onClick={() => chooseDoctor(d)}
                >
                  <span className="text-left">
                    <span className="block font-medium">Dr {d.full_name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.specialization ?? 'General Practice'}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          )}
        </StepShell>
      )}

      {step === 'date' && (
        <StepShell icon={CalendarDays} title="Choose a date">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="appt-date">Appointment date</Label>
            <Input
              id="appt-date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Button
              className="mt-2"
              disabled={!date || isPending}
              onClick={() => chooseDate(date)}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null} See times
            </Button>
          </div>
        </StepShell>
      )}

      {step === 'time' && (
        <StepShell icon={Clock} title={`Available times · ${formatDate(date)}`}>
          {loadingList ? (
            <Loading />
          ) : slots.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No available times"
              description="This doctor has no open slots on that date. Try another date."
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((s) => (
                <Button
                  key={s.start}
                  variant={slot?.start === s.start ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSlot(s);
                    setStep('reason');
                  }}
                >
                  {formatTime(s.start)}
                </Button>
              ))}
            </div>
          )}
        </StepShell>
      )}

      {step === 'reason' && (
        <StepShell icon={ClipboardList} title="Reason for visit">
          <div className="space-y-2">
            <Label htmlFor="reason">Briefly describe your reason (optional)</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={() => setStep('review')}>Review</Button>
          </div>
        </StepShell>
      )}

      {step === 'review' && (
        <StepShell icon={CheckCircle2} title="Review & confirm">
          <dl className="grid gap-3 text-sm">
            <Review label="Department" value={dept?.name} />
            <Review label="Doctor" value={doctor ? `Dr ${doctor.full_name}` : undefined} />
            <Review label="Date" value={formatDate(date)} />
            <Review label="Time" value={formatTime(slot?.start ?? null)} />
            <Review label="Reason" value={reason || 'General consultation'} />
          </dl>
          {error && (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="mt-4" onClick={confirm} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />} Confirm appointment
          </Button>
        </StepShell>
      )}
    </div>
  );
}

function StepShell({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}

function Review({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? '—'}</dd>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}
