import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/rbac';
import type { ProfileRow } from '@/types/database';

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Role;
}

/**
 * Resolve the authenticated user and their role from the profiles table.
 * Returns null when unauthenticated. Cached per-request.
 *
 * The role is read server-side from the database (not from client-controllable
 * metadata) so it can be trusted for gating, always in addition to RLS.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle<Pick<ProfileRow, 'full_name' | 'role'>>();

    return {
      id: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      // Default to the least-privileged role if a profile row is missing.
      role: (profile?.role as Role) ?? 'patient',
    };
  } catch {
    return null;
  }
});
