'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Power, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Building2 } from 'lucide-react';
import { departmentSchema, type DepartmentInput } from '@/lib/validation/department';
import {
  saveDepartmentAction,
  setDepartmentStatusAction,
} from '@/app/(dashboard)/dashboard/departments/actions';
import type { DepartmentRow } from '@/types/database';

export function DepartmentManager({ departments }: { departments: DepartmentRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleStatus(d: DepartmentRow) {
    setPendingId(d.id);
    await setDepartmentStatusAction(d.id, d.status === 'active' ? 'inactive' : 'active');
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">{departments.length} total</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus /> Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" />
      ) : (
        <div className="grid gap-3">
          {departments.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{d.name}</p>
                  <Badge variant={d.status === 'active' ? 'success' : 'secondary'}>
                    {d.status}
                  </Badge>
                </div>
                {d.description && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {d.description}
                  </p>
                )}
                {d.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {d.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
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
        <DepartmentDialog
          department={editing}
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

function DepartmentDialog({
  department,
  onClose,
  onSaved,
}: {
  department: DepartmentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? '',
      description: department?.description ?? '',
      location: department?.location ?? '',
      phone: department?.phone ?? '',
      opening_hours: department?.opening_hours ?? '',
      status: department?.status ?? 'active',
    },
  });

  async function onSubmit(values: DepartmentInput) {
    setServerError(null);
    const res = await saveDepartmentAction({ ...values, id: department?.id });
    if (res.ok) return onSaved();
    if (res.fieldErrors) {
      for (const [k, v] of Object.entries(res.fieldErrors)) {
        setError(k as keyof DepartmentInput, { message: v });
      }
    }
    setServerError(res.error ?? 'Unable to save.');
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={department ? 'Edit department' : 'Add department'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input {...register('description')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Location</Label>
            <Input {...register('location')} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...register('phone')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Opening hours</Label>
            <Input placeholder="Mon–Fri 08:00–18:00" {...register('opening_hours')} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
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
