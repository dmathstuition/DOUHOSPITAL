import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/admin/settings-form';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getSettings } from '@/lib/data/settings';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_SETTINGS')) redirect('/dashboard');

  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Health center configuration. API keys are never displayed.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
