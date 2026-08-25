'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import type { Json } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Save one settings section (admin-only). */
export async function saveSettingsAction(
  key: string,
  value: Record<string, unknown>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'MANAGE_SETTINGS')) {
    return { ok: false, error: 'Only an administrator can change settings.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value: value as unknown as Json });
  if (error) return { ok: false, error: 'Unable to save settings.' };

  revalidatePath('/admin/settings');
  return { ok: true };
}
