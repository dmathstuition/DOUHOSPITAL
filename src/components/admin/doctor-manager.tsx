'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Power, Loader2, CalendarClock, Stethoscope, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, initials } from '@/lib/utils';
import { doctorSchema, type DoctorInput } from '@/lib/validation/doctor';
import {
  saveDoctorAction,
  setDoctorStatusAction,
  deleteDoctorAction,
} from '@/app/(dashboard)/dashboard/doctors/actions';
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
  const [deleting, setDeleting] = useState<DoctorWithDept | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function toggleStatus(d: DoctorWithDept) {
    setPendingId(d.id);
    await setDoctorStatusAction(d.id, d.status === 'active' ? 'inactive' : 'active');
    setPendingId(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPendingId(deleting.id);
    setDeleteError(null);
    const res = await deleteDoctorAction(deleting.id);
    setPendingId(null);
    if (res.ok) {
      setDeleting(null);
      router.refresh();
    } else {
      setDeleteError(res.error ?? 'Unable to delete.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => {
            const isActive = d.status === 'active';
            return (
              <div
                key={d.id}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="pointer-events-none absolute inset-x-0 -top-14 h-28 bg-gradient-to-b from-secondary to-transparent opacity-70" />
                <div className="relative flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-lg font-semibold text-primary-foreground ring-4',
                      isActive ? 'ring-primary/30' : 'ring-border grayscale',
                    )}
                  >
                    {d.photo_url ? (
                      <Image
                        src={d.photo_url}
                        alt={`Dr ${d.full_name}`}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(d.full_name.split(' ')[0], d.full_name.split(' ')[1])
                    )}
                  </span>
                  <Badge variant={isActive ? 'success' : 'secondary'}>{d.status}</Badge>
                </div>

                <p className="relative mt-3 truncate font-semibold">Dr {d.full_name}</p>
                {d.specialization && (
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    {d.specialization}
                  </span>
                )}
                {d.department_name && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {d.department_name}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
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
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleting(d);
                    }}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleting && (
        <Dialog
          open
          onClose={() => setDeleting(null)}
          title="Delete doctor?"
          description={`Permanently remove Dr ${deleting.full_name} and their schedule. If they have appointments, deletion is blocked — deactivate instead.`}
        >
          {deleteError && (
            <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pendingId === deleting.id}
            >
              {pendingId === deleting.id && <Loader2 className="animate-spin" />} Delete doctor
            </Button>
          </div>
        </Dialog>
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
