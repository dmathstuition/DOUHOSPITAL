'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { doctorSchema, scheduleSchema, type DoctorInput, type ScheduleInput } from '@/lib/validation/doctor';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function authorize() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Your session has expired. Please sign in again.' };
  if (!can(user.role, 'MANAGE_DOCTORS')) {
    return { error: 'You are not authorized to manage doctors.' };
  }
  return { error: null };
}

function collectFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function saveDoctorAction(
  input: DoctorInput & { id?: string },
): Promise<ActionResult> {
  const { error: authError } = await authorize();
  if (authError) return { ok: false, error: authError };

  const parsed = doctorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const row = {
    full_name: v.full_name,
    department_id: v.department_id || null,
    specialization: v.specialization || null,
    email: v.email || null,
    phone: v.phone || null,
    photo_url: v.photo_url || null,
    biography: v.biography || null,
    status: v.status,
  };

  const query = input.id
    ? supabase.from('doctors').update(row).eq('id', input.id).select('id').single()
    : supabase.from('doctors').insert(row).select('id').single();

  const { data, error } = await query;
  if (error) return { ok: false, error: 'Unable to save the doctor. Please try again.' };

  revalidatePath('/dashboard/doctors');
  revalidatePath('/doctors');
  return { ok: true, id: data.id };
}

export async function setDoctorStatusAction(
  id: string,
  status: 'active' | 'inactive',
): Promise<ActionResult> {
  const { error: authError } = await authorize();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from('doctors').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'Unable to update the doctor.' };

  revalidatePath('/dashboard/doctors');
  revalidatePath('/doctors');
  return { ok: true, id };
}

export async function addScheduleAction(
  doctorId: string,
  input: ScheduleInput,
): Promise<ActionResult> {
  const { error: authError } = await authorize();
  if (authError) return { ok: false, error: authError };

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please correct the highlighted fields.',
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from('doctor_schedules').insert({
    doctor_id: doctorId,
    day_of_week: v.day_of_week,
    start_time: v.start_time,
    end_time: v.end_time,
    consultation_minutes: v.consultation_minutes,
    is_active: true,
  });
  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'A schedule already exists for that day and start time.' };
    }
    return { ok: false, error: 'Unable to add the schedule.' };
  }

  revalidatePath(`/dashboard/doctors/${doctorId}`);
  return { ok: true };
}

export async function deleteScheduleAction(
  scheduleId: string,
  doctorId: string,
): Promise<ActionResult> {
  const { error: authError } = await authorize();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from('doctor_schedules').delete().eq('id', scheduleId);
  if (error) return { ok: false, error: 'Unable to remove the schedule.' };

  revalidatePath(`/dashboard/doctors/${doctorId}`);
  return { ok: true };
}
