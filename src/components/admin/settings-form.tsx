'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { saveSettingsAction } from '@/app/(dashboard)/admin/settings/actions';
import type { SettingsMap } from '@/lib/data/settings';

type Fields = { key: string; label: string; type?: string }[];

function Section({
  title,
  settingsKey,
  fields,
  initial,
}: {
  title: string;
  settingsKey: string;
  fields: Fields;
  initial: Record<string, unknown>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of fields) v[f.key] = initial[f.key] != null ? String(initial[f.key]) : '';
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    // Preserve any keys we don't edit, coerce numeric-looking fields.
    const payload: Record<string, unknown> = { ...initial };
    for (const f of fields) {
      const raw = values[f.key];
      payload[f.key] = f.type === 'number' ? (raw === '' ? null : Number(raw)) : raw;
    }
    const res = await saveSettingsAction(settingsKey, payload);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(res.error ?? 'Unable to save.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              <Input
                type={f.type ?? 'text'}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} size="sm">
            {saving && <Loader2 className="animate-spin" />} Save
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsForm({ settings }: { settings: SettingsMap }) {
  const sms = settings.sms ?? {};
  const smsConfigured = sms.configured === true;

  return (
    <div className="space-y-6">
      <Section
        title="Health Center"
        settingsKey="health_center"
        initial={settings.health_center ?? {}}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'short_name', label: 'Short name' },
          { key: 'address', label: 'Address' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'emergency_phone', label: 'Emergency phone' },
        ]}
      />

      <Section
        title="Appointments"
        settingsKey="appointments"
        initial={settings.appointments ?? {}}
        fields={[
          { key: 'consultation_minutes', label: 'Default consultation minutes', type: 'number' },
          { key: 'booking_window_days', label: 'Booking window (days)', type: 'number' },
          { key: 'cancellation_hours', label: 'Cancellation notice (hours)', type: 'number' },
        ]}
      />

      <Section
        title="Notifications"
        settingsKey="notifications"
        initial={settings.notifications ?? {}}
        fields={[
          { key: 'follow_up_days_after', label: 'Follow-up (days after visit)', type: 'number' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMS (Termii)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={smsConfigured ? 'success' : 'secondary'}>
              {smsConfigured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Sender ID: {String(sms.sender_id ?? 'DOUHC')}
          </p>
          <p className="text-xs text-muted-foreground">
            Termii API keys live only in the Google Apps Script engine and are never
            shown or stored here.
          </p>
        </CardContent>
      </Card>

      <Section
        title="Privacy"
        settingsKey="privacy"
        initial={settings.privacy ?? {}}
        fields={[{ key: 'retention_years', label: 'Record retention (years)', type: 'number' }]}
      />
    </div>
  );
}
