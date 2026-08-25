'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Power, Loader2, CalendarClock, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { initials } from '@/lib/utils';
import { doctorSchema, type DoctorInput } from '@/lib/validation/doctor';
import { saveDoctorAction, setDoctorStatusAction } from '@/app/(dashboard)/dashboard/doctors/actions';
import type { DoctorWithDept } from '@/lib/data/admin';

interface DeptOption {
  id: string;
  name: string;
}

export function DoctorManager({
  doctors,
  departments,
}: {
  doctors: DoctorWithDept[];
  departments: DeptOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<DoctorWithDept | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleStatus(d: DoctorWithDept) {
    setPendingId(d.id);
    await setDoctorStatusAction(d.id, d.status === 'active' ? 'inactive' : 'active');
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">{doctors.length} total</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus /> Add Doctor
        </Button>
      </div>

      {doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors yet" />
      ) : (
        <div className="grid gap-3">
          {doctors.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                {initials(d.full_name.split(' ')[0], d.full_name.split(' ')[1])}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Dr {d.full_name}</p>
                  <Badge variant={d.status === 'active' ? 'success' : 'secondary'}>
                    {d.status}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {d.specialization ?? 'General Practice'}
                  {d.department_name ? ` · ${d.department_name}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/doctors/${d.id}`}>
                    <CalendarClock /> Schedule
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(d)}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStatus(d)}
                  disabled={pendingId === d.id}
                >
                  {pendingId === d.id ? <Loader2 className="animate-spin" /> : <Power />}
                  {d.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <DoctorDialog
          doctor={editing}
          departments={departments}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function DoctorDialog({
  doctor,
  departments,
  onClose,
  onSaved,
}: {
  doctor: DoctorWithDept | null;
  departments: DeptOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DoctorInput>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      full_name: doctor?.full_name ?? '',
      department_id: doctor?.department_id ?? '',
      specialization: doctor?.specialization ?? '',
      email: doctor?.email ?? '',
      phone: doctor?.phone ?? '',
      photo_url: doctor?.photo_url ?? '',
      biography: doctor?.biography ?? '',
      status: doctor?.status ?? 'active',
    },
  });

  async function onSubmit(values: DoctorInput) {
    setServerError(null);
    const res = await saveDoctorAction({ ...values, id: doctor?.id });
    if (res.ok) return onSaved();
    if (res.fieldErrors) {
      for (const [k, v] of Object.entries(res.fieldErrors)) {
        setError(k as keyof DoctorInput, { message: v });
      }
    }
    setServerError(res.error ?? 'Unable to save.');
  }

  return (
    <Dialog open onClose={onClose} title={doctor ? 'Edit doctor' : 'Add doctor'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label>Full name *</Label>
          <Input {...register('full_name')} />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select {...register('department_id')} defaultValue={doctor?.department_id ?? ''}>
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Specialization</Label>
            <Input {...register('specialization')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input placeholder="08012345678" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Photo URL</Label>
          <Input placeholder="https://…" {...register('photo_url')} />
          {errors.photo_url && (
            <p className="text-sm text-destructive">{errors.photo_url.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Biography</Label>
          <Input {...register('biography')} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
