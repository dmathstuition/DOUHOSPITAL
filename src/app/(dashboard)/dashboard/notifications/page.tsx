import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <ModulePlaceholder
      title="Notifications"
      phase="Phase 9"
      description="The notifications queue and logs are already written by the app and drained by the Google Apps Script engine. This screen surfaces their status."
      planned={[
        'Notification queue view',
        'Delivery logs & retries',
        'Templates management',
        'Channel status (SMS/email)',
        'Termii configuration state',
      ]}
    />
  );
}
