'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Plus, Loader2, Power, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ROLE_LABELS, ROLES, type Role } from '@/lib/rbac';
import { STAFF_ROLE_VALUES, type WorkerInput } from '@/lib/validation/user';
import {
  createWorkerAction,
  setUserRoleAction,
  setUserActiveAction,
} from '@/app/(dashboard)/dashboard/users/actions';

interface StaffMember {
  id: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
}

export function UserManager({
  staff,
  currentUserId,
}: {
  staff: StaffMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function changeRole(id: string, role: Role) {
    setPendingId(id);
    await setUserRoleAction(id, role);
    setPendingId(null);
    router.refresh();
  }

  async function toggleActive(m: StaffMember) {
    setPendingId(m.id);
    await setUserActiveAction(m.id, !m.is_active);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users &amp; Workers</h1>
          <p className="text-muted-foreground">{staff.length} staff account(s)</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add Worker
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No staff accounts yet" />
      ) : (
        <div className="grid gap-2">
          {staff.map((m) => {
            const isSelf = m.id === currentUserId;
            return (
              <Card key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {m.full_name ?? 'Unnamed'} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS[m.role]}</p>
                </div>
                {!m.is_active && <Badge variant="secondary">Inactive</Badge>}
                <Select
                  value={m.role}
                  disabled={isSelf || pendingId === m.id}
                  onChange={(e) => changeRole(m.id, e.target.value as Role)}
                  className="w-auto"
                >
                  {STAFF_ROLE_VALUES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSelf || pendingId === m.id}
                  onClick={() => toggleActive(m)}
                >
                  {pendingId === m.id ? <Loader2 className="animate-spin" /> : <Power />}
                  {m.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {adding && (
        <AddWorkerDialog
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddWorkerDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<WorkerInput>({
    defaultValues: { role: ROLES.NURSE },
  });
  const role = watch('role');

  async function onSubmit(values: WorkerInput) {
    setError(null);
    const res = await createWorkerAction(values);
    if (res.ok) return onDone();
    if (res.fieldErrors) {
      for (const [k, v] of Object.entries(res.fieldErrors)) {
        setFieldError(k as keyof WorkerInput, { message: v });
      }
    }
    setError(res.error ?? 'Unable to add the worker.');
  }

  return (
    <Dialog open onClose={onClose} title="Add worker" description="Create a staff account. They sign in with the email and temporary password you set.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label>Full name *</Label>
          <Input {...register('full_name')} />
          {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Temporary password *</Label>
          <Input type="text" {...register('password')} placeholder="At least 8 characters" />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          <p className="text-xs text-muted-foreground">Share this securely; ask them to change it after first sign-in.</p>
        </div>
        <div className="space-y-2">
          <Label>Role *</Label>
          <Select {...register('role')}>
            {STAFF_ROLE_VALUES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>
        </div>
        {role === ROLES.DOCTOR && (
          <div className="space-y-2">
            <Label>Specialization</Label>
            <Input {...register('specialization')} placeholder="e.g. General Practice" />
            <p className="text-xs text-muted-foreground">A linked doctor profile is created so patients can be assigned to them.</p>
          </div>
        )}
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />} Create account
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
