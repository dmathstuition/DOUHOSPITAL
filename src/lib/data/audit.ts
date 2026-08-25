import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database';

export interface AuditEntry {
  id: string;
  actor_name: string;
  actor_role: UserRole | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  created_at: string;
}

export interface AuditPage {
  rows: AuditEntry[];
  count: number;
  page: number;
  pageSize: number;
}

/** Paginated audit trail (admin-only via RLS). Optional action filter. */
export async function listAuditLogs(params: {
  action?: string;
  page?: number;
}): Promise<AuditPage> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let q = supabase
    .from('audit_logs')
    .select('id, actor_role, action, resource, resource_id, created_at, profiles:user_id ( full_name )', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.action) q = q.eq('action', params.action);

  const { data, count } = await q;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    actor_name: r.profiles?.full_name ?? 'System',
    actor_role: r.actor_role,
    action: r.action,
    resource: r.resource,
    resource_id: r.resource_id,
    created_at: r.created_at,
  }));

  return { rows, count: count ?? 0, page, pageSize };
}

/** Distinct action names for the filter dropdown. */
export async function listAuditActions(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('action')
    .order('action')
    .limit(1000);
  const set = new Set<string>();
  for (const r of data ?? []) if (r.action) set.add(r.action);
  return Array.from(set).sort();
}
