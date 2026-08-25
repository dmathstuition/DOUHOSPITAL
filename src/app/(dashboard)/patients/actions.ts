'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { patientSchema, type PatientInput } from '@/lib/validation/patient';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Register a new patient. Authorization is enforced three ways:
 *   1. getCurrentUser + RBAC capability check (server-side)
 *   2. Supabase RLS on the insert (uses the caller's session)
 *   3. Zod validation of the payload
 */
export async function createPatientAction(input: PatientInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' };
  if (!can(user.role, 'REGISTER_PATIENT')) {
    return { ok: false, error: 'You are not authorized to register patients.' };
  }

  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('patients')
    .insert({
      first_name: v.first_name,
      last_name: v.last_name,
      middle_name: v.middle_name || null,
      sex: v.sex ?? null,
      date_of_birth: v.date_of_birth || null,
      blood_group: v.blood_group ?? null,
      genotype: v.genotype ?? null,
      email: v.email || null,
      phone: v.phone || null,
      matric_number: v.matric_number || null,
      student_id: v.student_id || null,
      faculty: v.faculty || null,
      department: v.department || null,
      level: v.level || null,
      address: v.address || null,
      emergency_contact_name: v.emergency_contact_name || null,
      emergency_contact_phone: v.emergency_contact_phone || null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'A patient with that matric number already exists.' };
    }
    return { ok: false, error: 'Unable to register the patient. Please try again.' };
  }

  revalidatePath('/patients');
  return { ok: true, id: data.id };
}
