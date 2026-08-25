'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { departmentSchema, type DepartmentInput } from '@/lib/validation/department';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function authorize() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: 'Your session has expired. Please sign in again.' };
  if (!can(user.role, 'MANAGE_DEPARTMENTS')) {
    return { user: null, error: 'You are not authorized to manage departments.' };
  }
  return { user, error: null };
}

function collectFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function saveDepartmentAction(
  input: DepartmentInput & { id?: string },
): Promise<ActionResult> {
  const { error: authError } = await authorize();
  if (authError) return { ok: false, error: authError };

  const parsed = departmentSchema.safeParse(input);
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
    name: v.name,
    description: v.description || null,
    location: v.location || null,
    phone: v.phone || null,
    opening_hours: v.opening_hours || null,
    status: v.status,
  };

  const query = input.id
    ? supabase.from('departments').update(row).eq('id', input.id).select('id').single()
    : supabase.from('departments').insert(row).select('id').single();

  const { data, error } = await query;
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'A department with that name already exists.' };
    return { ok: false, error: 'Unable to save the department. Please try again.' };
  }

  revalidatePath('/dashboard/departments');
  revalidatePath('/departments');
  return { ok: true, id: data.id };
}

/** Soft toggle: departments with history are never hard-deleted. */
export async function setDepartmentStatusAction(
  id: string,
  status: 'active' | 'inactive',
): Promise<ActionResult> {
  const { error: authError } = await authorize();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from('departments').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'Unable to update the department.' };

  revalidatePath('/dashboard/departments');
  revalidatePath('/departments');
  return { ok: true, id };
}
