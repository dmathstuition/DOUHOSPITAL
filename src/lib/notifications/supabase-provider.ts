import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';
import type {
  NotificationProvider,
  NotificationRequest,
  EnqueueResult,
} from './types';

/**
 * The default provider. It does NOT send anything itself — it records the
 * notification as a row in Supabase (the source of truth). The Google Apps
 * Script "DOUHC Notification Engine" polls this table and performs delivery
 * (Termii for SMS, Gmail/MailApp for email today; Resend can replace the email
 * path later without touching this code).
 *
 * Idempotency: `dedupeKey` maps to a unique column so a duplicate enqueue is a
 * safe no-op — critical because scheduled jobs may run more than once.
 */
export class SupabaseNotificationProvider implements NotificationProvider {
  async enqueue(request: NotificationRequest): Promise<EnqueueResult> {
    try {
      const supabase = createAdminClient();

      const row = {
        channel: request.channel,
        notification_type: request.type,
        recipient: request.recipient,
        message: request.message ?? null,
        subject: request.subject ?? null,
        patient_id: request.patientId ?? null,
        appointment_id: request.appointmentId ?? null,
        scheduled_at: request.scheduledAt ?? new Date().toISOString(),
        status: 'pending' as const,
        retry_count: 0,
        dedupe_key: request.dedupeKey ?? null,
        payload: (request.data ?? {}) as Json,
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(row)
        .select('id')
        .single();

      if (error) {
        // 23505 = unique_violation → idempotent duplicate, treat as success.
        if (error.code === '23505') {
          return { ok: true, duplicate: true };
        }
        return { ok: false, error: error.message };
      }

      return { ok: true, id: data.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { ok: false, error: message };
    }
  }
}
