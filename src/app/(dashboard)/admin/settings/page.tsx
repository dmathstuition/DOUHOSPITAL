import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_SETTINGS')) redirect('/dashboard');

  return (
    <ModulePlaceholder
      title="Settings"
      phase="Phase 9"
      description="Health center, appointment, notification, SMS and privacy settings are stored in system_settings (seeded) and edited here. API keys are never displayed."
      planned={[
        'Health center details, logo & hero',
        'Consultation duration & booking window',
        'Reminder & follow-up timing',
        'SMS: Termii status & sender ID (no keys)',
        'Privacy notice & retention',
      ]}
    />
  );
}
