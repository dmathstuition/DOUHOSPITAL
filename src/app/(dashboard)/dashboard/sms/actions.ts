'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { previewRecipientCount, type RecipientFilter } from '@/lib/data/sms';
import { normalizeNigerianPhone } from '@/lib/utils/phone';
import type { Json } from '@/types/database';

export interface PreviewResult {
  ok: boolean;
  count?: number;
  error?: string;
}

export async function previewCampaignAction(filter: RecipientFilter): Promise<PreviewResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'SEND_BULK_SMS')) return { ok: false, error: 'Not authorized.' };
  const count = await previewRecipientCount(filter);
  return { ok: true, count };
}

export interface SendResult {
  ok: boolean;
  error?: string;
  queued?: number;
}

const MAX_RECIPIENTS = 2000; // rate-limit guard per campaign

/**
 * Create and enqueue a bulk SMS campaign. Admin-only. Resolves recipients from
 * the filter, records the campaign + recipients, and enqueues one notification
 * per recipient (deduped) for the Apps Script engine to deliver via Termii.
 */
export async function sendCampaignAction(params: {
  title: string;
  message: string;
  filter: RecipientFilter;
}): Promise<SendResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'SEND_BULK_SMS')) return { ok: false, error: 'Not authorized.' };

  const title = params.title.trim() || 'Campaign';
  const message = params.message.trim();
  if (message.length < 3) return { ok: false, error: 'Enter a message to send.' };

  const admin = createAdminClient();

  // Resolve recipients (patients with a phone matching the filter).
  let rq = admin
    .from('patients')
    .select('id, first_name, phone')
    .is('deleted_at', null)
    .not('phone', 'is', null)
    .limit(MAX_RECIPIENTS);
  if (params.filter.audience === 'department' && params.filter.value) {
    rq = rq.eq('department', params.filter.value);
  }
  if (params.filter.audience === 'faculty' && params.filter.value) {
    rq = rq.eq('faculty', params.filter.value);
  }
  const { data: patients, error: pErr } = await rq;
  if (pErr) return { ok: false, error: 'Unable to resolve recipients.' };

  const recipients = (patients ?? [])
    .map((p) => ({
      id: p.id,
      name: p.first_name,
      phone: normalizeNigerianPhone(p.phone),
    }))
    .filter((r): r is { id: string; name: string; phone: string } => !!r.phone);

  if (recipients.length === 0) return { ok: false, error: 'No valid recipients found.' };

  // Record the campaign.
  const { data: campaign, error: cErr } = await admin
    .from('sms_campaigns')
    .insert({
      title,
      message,
      filters: params.filter as unknown as Json,
      recipient_count: recipients.length,
      status: 'pending',
      created_by: user.id,
    })
    .select('id')
    .single();
  if (cErr || !campaign) return { ok: false, error: 'Unable to create the campaign.' };

  // Record recipients + enqueue notifications in chunks.
  const CHUNK = 200;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK);
    await admin.from('sms_campaign_recipients').insert(
      slice.map((r) => ({ campaign_id: campaign.id, patient_id: r.id, phone: r.phone, status: 'pending' as const })),
    );
    await admin.from('notifications').insert(
      slice.map((r) => ({
        patient_id: r.id,
        channel: 'sms' as const,
        notification_type: 'campaign',
        recipient: r.phone,
        message: message.replace(/\{name\}/g, r.name || 'there'),
        status: 'pending' as const,
        scheduled_at: new Date().toISOString(),
        dedupe_key: `campaign:${campaign.id}:${r.id}`,
        payload: { campaign_id: campaign.id } as unknown as Json,
      })),
    );
  }

  // Audit the campaign.
  try {
    await admin.from('audit_logs').insert({
      user_id: user.id,
      actor_role: user.role,
      action: 'sms_campaign',
      resource: 'sms_campaigns',
      resource_id: campaign.id,
      metadata: { recipients: recipients.length, filter: params.filter } as unknown as Json,
    });
  } catch {
    /* ignore */
  }

  revalidatePath('/dashboard/sms');
  return { ok: true, queued: recipients.length };
}
