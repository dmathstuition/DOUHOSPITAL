import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { NotificationRow, NotificationStatus } from '@/types/database';

export interface NotificationSummary {
  pending: number;
  sent: number;
  failed: number;
}

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const supabase = await createClient();
  const count = async (status: NotificationStatus) => {
    const { count: c } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);
    return c ?? 0;
  };
  const [pending, processing, sent, failed] = await Promise.all([
    count('pending'),
    count('processing'),
    count('sent'),
    count('failed'),
  ]);
  return { pending: pending + processing, sent, failed };
}

export async function listRecentNotifications(): Promise<
  Pick<
    NotificationRow,
    'id' | 'channel' | 'notification_type' | 'recipient' | 'status' | 'scheduled_at' | 'sent_at' | 'error_message'
  >[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, channel, notification_type, recipient, status, scheduled_at, sent_at, error_message')
    .order('scheduled_at', { ascending: false })
    .limit(100);
  return (data ?? []) as Pick<
    NotificationRow,
    'id' | 'channel' | 'notification_type' | 'recipient' | 'status' | 'scheduled_at' | 'sent_at' | 'error_message'
  >[];
}
