'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { prescriptionSchema, type PrescriptionInput } from '@/lib/validation/clinical';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createPrescriptionAction(input: PrescriptionInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'CREATE_PRESCRIPTION')) {
    return { ok: false, error: 'Only doctors can create prescriptions.' };
  }

  const parsed = prescriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid prescription.' };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle<{ id: string }>();

  const { data: presc, error } = await supabase
    .from('prescriptions')
    .insert({
      patient_id: v.patient_id,
      doctor_id: doctor?.id ?? null,
      diagnosis: v.diagnosis || null,
      status: 'active',
      dispense_state: 'pending',
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: 'Unable to create the prescription.' };

  const items = v.items.map((it) => ({
    prescription_id: presc.id,
    medication_name: it.medication_name,
    dosage: it.dosage || null,
    frequency: it.frequency || null,
    duration: it.duration || null,
    route: it.route || null,
    instructions: it.instructions || null,
    quantity: it.quantity ?? null,
    dispensed_qty: 0,
  }));

  const { error: itemsError } = await supabase.from('prescription_items').insert(items);
  if (itemsError) {
    // Roll back the header so we never leave an itemless prescription.
    await supabase.from('prescriptions').delete().eq('id', presc.id);
    return { ok: false, error: 'Unable to save prescription items.' };
  }

  revalidatePath('/dashboard/prescriptions');
  revalidatePath(`/patients/${v.patient_id}`);
  return { ok: true, id: presc.id };
}
