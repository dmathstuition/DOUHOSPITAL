'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { CalendarClock } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { scheduleSchema, type ScheduleInput, DAYS } from '@/lib/validation/doctor';
import { addScheduleAction, deleteScheduleAction } from '@/app/(dashboard)/dashboard/doctors/actions';
import type { DoctorScheduleRow } from '@/types/database';

export function ScheduleManager({
  doctorId,
  schedules,
}: {
  doctorId: string;
  schedules: DoctorScheduleRow[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      day_of_week: 1,
      start_time: '08:00',
      end_time: '16:00',
      consultation_minutes: 30,
    },
  });

  async function onSubmit(values: ScheduleInput) {
    setServerError(null);
    const res = await addScheduleAction(doctorId, values);
    if (res.ok) {
      reset();
      router.refresh();
      return;
    }
    if (res.fieldErrors) {
      for (const [k, v] of Object.entries(res.fieldErrors)) {
        setError(k as keyof ScheduleInput, { message: v });
      }
    }
    setServerError(res.error ?? 'Unable to add schedule.');
  }

  async function remove(id: string) {
    setPendingId(id);
    await deleteScheduleAction(id, doctorId);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">Add weekly availability</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4" noValidate>
          <div className="space-y-2">
            <Label>Day</Label>
            <Select {...register('day_of_week')}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Start</Label>
            <Input type="time" {...register('start_time')} />
          </div>
          <div className="space-y-2">
            <Label>End</Label>
            <Input type="time" {...register('end_time')} />
            {errors.end_time && (
              <p className="text-xs text-destructive">{errors.end_time.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Slot (min)</Label>
            <Input type="number" min={5} max={240} {...register('consultation_minutes')} />
          </div>
          <div className="sm:col-span-4">
            {serverError && (
              <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus />} Add
            </Button>
          </div>
        </form>
      </Card>

      {schedules.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No schedule configured" description="Add weekly availability so appointment slots can be generated." />
      ) : (
        <div className="grid gap-2">
          {schedules.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{DAYS[s.day_of_week]}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(s.start_time)} – {formatTime(s.end_time)} · {s.consultation_minutes} min slots
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(s.id)}
                disabled={pendingId === s.id}
                aria-label="Remove schedule"
              >
                {pendingId === s.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
