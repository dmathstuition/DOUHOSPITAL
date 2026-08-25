'use client';

import { useState } from 'react';
import { Loader2, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import {
  previewCampaignAction,
  sendCampaignAction,
} from '@/app/(dashboard)/dashboard/sms/actions';
import type { Audience } from '@/lib/data/sms';

export function SmsCampaign({
  departments,
  faculties,
}: {
  departments: string[];
  faculties: string[];
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [value, setValue] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filter = { audience, value: value || undefined };

  async function preview() {
    setPreviewing(true);
    setError(null);
    setResult(null);
    const res = await previewCampaignAction(filter);
    setPreviewing(false);
    if (res.ok) setCount(res.count ?? 0);
    else setError(res.error ?? 'Preview failed.');
  }

  async function send() {
    setSending(true);
    setError(null);
    const res = await sendCampaignAction({ title, message, filter });
    setSending(false);
    setConfirmOpen(false);
    if (res.ok) {
      setResult(`Campaign queued for ${res.queued} recipient(s). Delivery runs through the SMS engine.`);
      setCount(null);
      setMessage('');
      setTitle('');
    } else {
      setError(res.error ?? 'Unable to send campaign.');
    }
  }

  const segments = Math.max(1, Math.ceil(message.length / 160));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>Campaign title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Health screening week" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={audience}
                onChange={(e) => {
                  setAudience(e.target.value as Audience);
                  setValue('');
                  setCount(null);
                }}
              >
                <option value="all">All patients</option>
                <option value="department">By department</option>
                <option value="faculty">By faculty</option>
              </Select>
            </div>
            {audience !== 'all' && (
              <div className="space-y-2">
                <Label>{audience === 'department' ? 'Department' : 'Faculty'}</Label>
                <Select value={value} onChange={(e) => { setValue(e.target.value); setCount(null); }}>
                  <option value="">Select…</option>
                  {(audience === 'department' ? departments : faculties).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={640}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Use {name} to personalise with the patient's first name."
            />
            <p className="text-xs text-muted-foreground">
              {message.length} chars · ~{segments} SMS segment{segments === 1 ? '' : 's'} per recipient
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={preview} disabled={previewing}>
              {previewing ? <Loader2 className="animate-spin" /> : <Users />} Preview recipients
            </Button>
            {count !== null && (
              <div className="rounded-md bg-secondary px-3 py-2 text-sm">
                <span className="font-medium">Recipients: {count}</span> · Estimated SMS: {count * segments}
              </div>
            )}
            <Button
              className="ml-auto"
              disabled={count === null || count === 0 || message.trim().length < 3}
              onClick={() => setConfirmOpen(true)}
            >
              <Send /> Send campaign
            </Button>
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {result && <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{result}</p>}
        </CardContent>
      </Card>

      {confirmOpen && (
        <Dialog
          open
          onClose={() => setConfirmOpen(false)}
          title="Send bulk SMS?"
          description={`This will queue an SMS to ${count} recipient(s). This cannot be undone.`}
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={send} disabled={sending}>
              {sending && <Loader2 className="animate-spin" />} Confirm &amp; send
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
