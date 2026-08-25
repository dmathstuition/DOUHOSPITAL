'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { can, ROLES, type Role } from '@/lib/rbac';
import { workerSchema, type WorkerInput } from '@/lib/validation/user';

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

async function requireAdmin(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return 'Your session has expired.';
  if (!can(user.role, 'MANAGE_USERS')) return 'Only an administrator can manage staff.';
  return null;
}

/**
 * Create a staff account. Admin-only. Uses the service role to create the auth
 * user (email pre-confirmed), then sets the trusted role on their profile. If
 * the role is doctor, a linked doctor record is created so they get a worklist.
 */
export async function createWorkerAction(input: WorkerInput): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = workerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === 'string' && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }
  const v = parsed.data;
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.full_name },
  });
  if (createError || !created.user) {
    const msg = createError?.message ?? '';
    if (/already/i.test(msg)) return { ok: false, error: 'A user with that email already exists.' };
    return { ok: false, error: 'Unable to create the staff account.' };
  }

  const userId = created.user.id;

  // The handle_new_user trigger inserts a profile with role 'patient';
  // set the real staff role and name here (trusted, server-side).
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: userId, full_name: v.full_name, role: v.role, is_active: true });
  if (profileError) {
    return { ok: false, error: 'Account created but role assignment failed. Edit the user to fix.' };
  }

  if (v.role === ROLES.DOCTOR) {
    await admin.from('doctors').insert({
      profile_id: userId,
      full_name: v.full_name,
      specialization: v.specialization || null,
      status: 'active',
    });
  }

  revalidatePath('/dashboard/users');
  return { ok: true };
}

/** Change a staff member's role (admin-only). */
export async function setUserRoleAction(userId: string, role: Role): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: 'Unable to update the role.' };

  revalidatePath('/dashboard/users');
  return { ok: true };
}

/** Activate / deactivate a staff account (admin-only). */
export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const authError = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  if (error) return { ok: false, error: 'Unable to update the account.' };

  revalidatePath('/dashboard/users');
  return { ok: true };
}
