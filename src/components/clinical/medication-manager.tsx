'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Loader2, AlertTriangle, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Pill } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { saveMedicationAction } from '@/app/(dashboard)/dashboard/pharmacy/actions';
import type { MedicationRow } from '@/types/database';

interface FormValues {
  name: string;
  category: string;
  batch_number: string;
  quantity: string;
  expiry_date: string;
  reorder_level: string;
  supplier: string;
  price: string;
}

function expiryStatus(date: string | null): 'expired' | 'soon' | 'ok' | null {
  if (!date) return null;
  const d = new Date(date).getTime();
  const now = Date.now();
  if (d < now) return 'expired';
  if (d < now + 90 * 24 * 3600 * 1000) return 'soon';
  return 'ok';
}

export function MedicationManager({ medications }: { medications: MedicationRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MedicationRow | null>(null);
  const [creating, setCreating] = useState(false);

  const lowStock = medications.filter((m) => m.quantity <= m.reorder_level);
  const expiring = medications.filter((m) => {
    const s = expiryStatus(m.expiry_date);
    return s === 'expired' || s === 'soon';
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Medication Inventory</h2>
        <Button onClick={() => setCreating(true)}>
          <Plus /> Add Medication
        </Button>
      </div>

      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-sm text-warning">
              <PackageX className="h-4 w-4" /> {lowStock.length} item(s) at or below reorder level
            </div>
          )}
          {expiring.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {expiring.length} item(s) expired or expiring soon
            </div>
          )}
        </div>
      )}

      {medications.length === 0 ? (
        <EmptyState icon={Pill} title="No medications in inventory" />
      ) : (
        <div className="grid gap-2">
          {medications.map((m) => {
            const low = m.quantity <= m.reorder_level;
            const exp = expiryStatus(m.expiry_date);
            return (
              <Card key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.category ?? 'Uncategorised'}
                    {m.batch_number ? ` · Batch ${m.batch_number}` : ''}
                    {m.expiry_date ? ` · Exp ${formatDate(m.expiry_date)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={low ? 'warning' : 'secondary'}>Qty {m.quantity}</Badge>
                  {exp === 'expired' && <Badge variant="destructive">Expired</Badge>}
                  {exp === 'soon' && <Badge variant="warning">Expiring</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(m)}>
                  <Pencil /> Edit
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <MedicationDialog
          medication={editing}
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

function MedicationDialog({
  medication,
  onClose,
  onSaved,
}: {
  medication: MedicationRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: medication?.name ?? '',
      category: medication?.category ?? '',
      batch_number: medication?.batch_number ?? '',
      quantity: String(medication?.quantity ?? 0),
      expiry_date: medication?.expiry_date ?? '',
      reorder_level: String(medication?.reorder_level ?? 10),
      supplier: medication?.supplier ?? '',
      price: medication?.price != null ? String(medication.price) : '',
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const res = await saveMedicationAction({
      id: medication?.id,
      name: values.name,
      category: values.category,
      batch_number: values.batch_number,
      quantity: Number(values.quantity || 0),
      expiry_date: values.expiry_date,
      reorder_level: Number(values.reorder_level || 0),
      supplier: values.supplier,
      price: values.price === '' ? undefined : Number(values.price),
    });
    if (res.ok) return onSaved();
    setError(res.error ?? 'Unable to save.');
  }

  return (
    <Dialog open onClose={onClose} title={medication ? 'Edit medication' : 'Add medication'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input {...register('name')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Category</Label><Input {...register('category')} /></div>
          <div className="space-y-2"><Label>Batch number</Label><Input {...register('batch_number')} /></div>
          <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={0} {...register('quantity')} /></div>
          <div className="space-y-2"><Label>Reorder level</Label><Input type="number" min={0} {...register('reorder_level')} /></div>
          <div className="space-y-2"><Label>Expiry date</Label><Input type="date" {...register('expiry_date')} /></div>
          <div className="space-y-2"><Label>Price (₦)</Label><Input type="number" min={0} step="0.01" {...register('price')} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Supplier</Label><Input {...register('supplier')} /></div>
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />} Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
