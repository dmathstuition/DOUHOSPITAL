'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { medicationSchema, type MedicationInput } from '@/lib/validation/clinical';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function authorizeInventory() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired.' };
  // Pharmacy inventory is managed by nurses / super admins.
  if (!can(user.role, 'DISPENSE_MEDICATION')) return { error: 'Not authorized.' };
  return { error: null };
}

export async function saveMedicationAction(
  input: MedicationInput & { id?: string },
): Promise<ActionResult> {
  const { error: authError } = await authorizeInventory();
  if (authError) return { ok: false, error: authError };

  const parsed = medicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === 'string' && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const row = {
    name: v.name,
    category: v.category || null,
    batch_number: v.batch_number || null,
    quantity: v.quantity,
    expiry_date: v.expiry_date || null,
    reorder_level: v.reorder_level,
    supplier: v.supplier || null,
    price: v.price ?? null,
  };

  const query = input.id
    ? supabase.from('medications').update(row).eq('id', input.id).select('id').single()
    : supabase.from('medications').insert(row).select('id').single();

  const { data, error } = await query;
  if (error) return { ok: false, error: 'Unable to save the medication.' };

  revalidatePath('/dashboard/pharmacy');
  return { ok: true, id: data.id };
}

/** Dispense a prescription: mark items dispensed and update its state. */
export async function dispensePrescriptionAction(
  prescriptionId: string,
  mode: 'partial' | 'full',
): Promise<ActionResult> {
  const { error: authError } = await authorizeInventory();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();

  if (mode === 'full') {
    // Set each item's dispensed quantity to its prescribed quantity.
    const { data: items } = await supabase
      .from('prescription_items')
      .select('id, quantity')
      .eq('prescription_id', prescriptionId);
    for (const it of items ?? []) {
      await supabase
        .from('prescription_items')
        .update({ dispensed_qty: it.quantity ?? 0 })
        .eq('id', it.id);
    }
    await supabase
      .from('prescriptions')
      .update({ dispense_state: 'dispensed', status: 'completed' })
      .eq('id', prescriptionId);
  } else {
    await supabase
      .from('prescriptions')
      .update({ dispense_state: 'partial' })
      .eq('id', prescriptionId);
  }

  revalidatePath('/dashboard/pharmacy');
  revalidatePath(`/dashboard/prescriptions/${prescriptionId}`);
  return { ok: true, id: prescriptionId };
}
