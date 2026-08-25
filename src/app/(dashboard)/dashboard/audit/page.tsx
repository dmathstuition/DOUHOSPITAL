import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { getCurrentUser } from '@/lib/auth';
import { can, ROLE_LABELS } from '@/lib/rbac';
import { listAuditLogs, listAuditActions } from '@/lib/data/audit';

export const metadata: Metadata = { title: 'Audit Logs' };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'VIEW_AUDIT_LOGS')) redirect('/dashboard');

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const [{ rows, count, pageSize }, actions] = await Promise.all([
    listAuditLogs({ action: sp.action, page }),
    listAuditActions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const href = (p: number) => {
    const q = new URLSearchParams();
    if (sp.action) q.set('action', sp.action);
    if (p > 1) q.set('page', String(p));
    const s = q.toString();
    return `/dashboard/audit${s ? `?${s}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Append-only activity trail · {count} entries</p>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={!sp.action ? 'default' : 'outline'} size="sm">
            <Link href="/dashboard/audit">All</Link>
          </Button>
          {actions.map((a) => (
            <Button
              key={a}
              asChild
              variant={sp.action === a ? 'default' : 'outline'}
              size="sm"
            >
              <Link href={`/dashboard/audit?action=${encodeURIComponent(a)}`}>{a}</Link>
            </Button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      {r.actor_name}
                      {r.actor_role && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({ROLE_LABELS[r.actor_role]})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{r.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.resource ?? '—'}
                      {r.resource_id ? ` · ${r.resource_id.slice(0, 8)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          {page <= 1 ? (
            <Button variant="outline" size="sm" disabled><ChevronLeft /> Previous</Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={href(page - 1)}><ChevronLeft /> Previous</Link>
            </Button>
          )}
          {page >= totalPages ? (
            <Button variant="outline" size="sm" disabled>Next <ChevronRight /></Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={href(page + 1)}>Next <ChevronRight /></Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
