import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Bell, Send, CheckCircle2, XCircle, MessageSquare, Mail } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import {
  getNotificationSummary,
  listRecentNotifications,
} from '@/lib/data/notifications-admin';
import { maskRecipient } from '@/lib/utils';

export const metadata: Metadata = { title: 'Notifications' };

const STATUS_VARIANT: Record<string, 'warning' | 'secondary' | 'success' | 'destructive'> = {
  pending: 'warning',
  processing: 'secondary',
  sent: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_NOTIFICATIONS')) redirect('/dashboard');

  const [summary, recent] = await Promise.all([
    getNotificationSummary(),
    listRecentNotifications(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          The queue drained by the Google Apps Script engine (Termii SMS · email).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={summary.pending} icon={Send} />
        <StatCard label="Sent" value={summary.sent} icon={CheckCircle2} />
        <StatCard label="Failed" value={summary.failed} icon={XCircle} />
      </div>

      {recent.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((n) => (
                  <tr key={n.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {n.channel === 'sms' ? (
                          <MessageSquare className="h-3.5 w-3.5" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" />
                        )}
                        {n.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{n.notification_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{maskRecipient(n.recipient)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[n.status] ?? 'secondary'}>{n.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(n.scheduled_at).toLocaleString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
