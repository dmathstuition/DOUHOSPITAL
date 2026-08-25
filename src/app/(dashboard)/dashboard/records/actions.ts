'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { consultationSchema, vitalsSchema, type ConsultationInput, type VitalsInput } from '@/lib/validation/clinical';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path[0];
    if (typeof k === 'string' && !out[k]) out[k] = i.message;
  }
  return out;
}

/** Doctor's own doctor-record id, used to attribute clinical entries. */
async function doctorIdFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('doctors')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function createConsultationAction(input: ConsultationInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'CREATE_CONSULTATION')) {
    return { ok: false, error: 'Only doctors can record consultations.' };
  }

  const parsed = consultationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const doctorId = await doctorIdFor(supabase, user.id);

  const { data, error } = await supabase
    .from('medical_records')
    .insert({
      patient_id: v.patient_id,
      doctor_id: doctorId,
      appointment_id: v.appointment_id || null,
      symptoms: v.symptoms || null,
      examination: v.examination || null,
      diagnosis: v.diagnosis || null,
      treatment_plan: v.treatment_plan || null,
      doctor_notes: v.doctor_notes || null,
      follow_up_date: v.follow_up_date || null,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: 'Unable to save the consultation.' };

  revalidatePath(`/patients/${v.patient_id}`);
  revalidatePath('/dashboard/records');
  return { ok: true, id: data.id };
}

export async function recordVitalsAction(input: VitalsInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'RECORD_VITALS')) {
    return { ok: false, error: 'You are not authorized to record vital signs.' };
  }

  const parsed = vitalsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error.issues) };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // BMI is computed by a DB trigger from weight + height.
  const { error } = await supabase.from('vital_signs').insert({
    patient_id: v.patient_id,
    recorded_by: user.id,
    blood_pressure: v.blood_pressure || null,
    temperature: v.temperature ?? null,
    weight: v.weight ?? null,
    height: v.height ?? null,
    pulse: v.pulse ?? null,
    respiratory_rate: v.respiratory_rate ?? null,
    oxygen_saturation: v.oxygen_saturation ?? null,
  });

  if (error) return { ok: false, error: 'Unable to record vital signs.' };

  revalidatePath(`/patients/${v.patient_id}`);
  return { ok: true };
}
