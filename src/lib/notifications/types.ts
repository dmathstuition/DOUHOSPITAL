/** Notification channels supported by the platform. */
export type NotificationChannel = 'sms' | 'email';

/** Lifecycle status of a queued notification. */
export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled';

/** Semantic notification types (map to templates). */
export type NotificationType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'follow_up'
  | 'lab_result'
  | 'welcome'
  | 'generic';

/** A request to enqueue a notification. */
export interface NotificationRequest {
  channel: NotificationChannel;
  type: NotificationType;
  /** E.164 phone for SMS or email address for EMAIL. */
  recipient: string;
  message?: string;
  subject?: string;
  patientId?: string | null;
  appointmentId?: string | null;
  /** ISO timestamp; when omitted the notification is due immediately. */
  scheduledAt?: string | null;
  /** Arbitrary template variables passed through to the rendering layer. */
  data?: Record<string, unknown>;
  /**
   * Idempotency key. When present, a unique constraint prevents the same
   * logical notification from being enqueued twice (e.g. a 24h reminder).
   */
  dedupeKey?: string | null;
}

/** Result of enqueuing a notification. */
export interface EnqueueResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when the notification already existed (idempotent no-op). */
  duplicate?: boolean;
}

/**
 * The provider contract. Today the only implementation enqueues into Supabase
 * for Google Apps Script to deliver. A future Resend-backed email provider
 * implements the same interface with no changes to callers.
 */
export interface NotificationProvider {
  enqueue(request: NotificationRequest): Promise<EnqueueResult>;
}
