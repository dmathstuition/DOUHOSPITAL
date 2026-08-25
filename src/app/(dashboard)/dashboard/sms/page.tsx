import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';

export const metadata: Metadata = { title: 'SMS Campaigns' };

export default function SmsCampaignsPage() {
  return (
    <ModulePlaceholder
      title="SMS Campaigns"
      phase="Phase 9"
      description="Bulk SMS uses sms_campaigns / sms_campaign_recipients with recipient filtering, confirmation and rate limiting. Delivery runs through Termii via the engine."
      planned={[
        'Filter recipients (students, department…)',
        'Recipient count + estimate preview',
        'Confirmation before sending',
        'Rate limiting',
        'Campaign logging',
        'Delivery report',
      ]}
    />
  );
}
