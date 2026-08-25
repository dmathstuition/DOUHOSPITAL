import 'server-only';
import { normalizeNigerianPhone } from '@/lib/utils/phone';
import { SupabaseNotificationProvider } from './supabase-provider';
import {
  appointmentConfirmationSMS,
  appointmentReminderSMS,
  followUpSMS,
  appointmentConfirmationEmail,
  welcomeEmail,
  labResultEmail,
  type AppointmentTemplateVars,
} from './templates';
import type { EnqueueResult, NotificationProvider } from './types';

export * from './types';

/**
 * NotificationService — the single, provider-independent entry point the rest
 * of the application uses. Swapping the underlying transport (e.g. introducing
 * Resend for email) means changing the provider wiring here only.
 */
class NotificationService {
  constructor(private readonly provider: NotificationProvider) {}

  /** Low-level primitive: enqueue a raw email notification. */
  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    patientId?: string | null;
    dedupeKey?: string | null;
  }): Promise<EnqueueResult> {
    return this.provider.enqueue({
      channel: 'email',
      type: 'generic',
      recipient: params.to,
      subject: params.subject,
      message: params.body,
      patientId: params.patientId ?? null,
      dedupeKey: params.dedupeKey ?? null,
    });
  }

  /** Low-level primitive: enqueue a raw SMS notification. */
  async sendSMS(params: {
    to: string;
    message: string;
    patientId?: string | null;
    dedupeKey?: string | null;
  }): Promise<EnqueueResult> {
    const normalized = normalizeNigerianPhone(params.to);
    if (!normalized) {
      return { ok: false, error: 'Invalid Nigerian phone number' };
    }
    return this.provider.enqueue({
      channel: 'sms',
      type: 'generic',
      recipient: normalized,
      message: params.message,
      patientId: params.patientId ?? null,
      dedupeKey: params.dedupeKey ?? null,
    });
  }

  /** Enqueue confirmation (SMS + email) for a freshly booked appointment. */
  async sendAppointmentConfirmation(params: {
    appointmentId: string;
    patientId: string;
    phone?: string | null;
    email?: string | null;
    vars: AppointmentTemplateVars;
  }): Promise<{ sms?: EnqueueResult; email?: EnqueueResult }> {
    const out: { sms?: EnqueueResult; email?: EnqueueResult } = {};

    if (params.phone) {
      const normalized = normalizeNigerianPhone(params.phone);
      if (normalized) {
        out.sms = await this.provider.enqueue({
          channel: 'sms',
          type: 'appointment_confirmation',
          recipient: normalized,
          message: appointmentConfirmationSMS(params.vars),
          patientId: params.patientId,
          appointmentId: params.appointmentId,
          dedupeKey: `confirm:sms:${params.appointmentId}`,
        });
      }
    }

    if (params.email) {
      const { subject, body } = appointmentConfirmationEmail(params.vars);
      out.email = await this.provider.enqueue({
        channel: 'email',
        type: 'appointment_confirmation',
        recipient: params.email,
        subject,
        message: body,
        patientId: params.patientId,
        appointmentId: params.appointmentId,
        dedupeKey: `confirm:email:${params.appointmentId}`,
      });
    }

    return out;
  }

  /**
   * Enqueue a 24-hour reminder. `dedupeKey` guarantees a single reminder even
   * if the scheduling job runs more than once.
   */
  async sendAppointmentReminder(params: {
    appointmentId: string;
    patientId: string;
    phone?: string | null;
    vars: AppointmentTemplateVars;
    scheduledAt?: string;
  }): Promise<EnqueueResult> {
    const normalized = params.phone ? normalizeNigerianPhone(params.phone) : null;
    if (!normalized) return { ok: false, error: 'Invalid phone number' };
    return this.provider.enqueue({
      channel: 'sms',
      type: 'appointment_reminder',
      recipient: normalized,
      message: appointmentReminderSMS(params.vars),
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      scheduledAt: params.scheduledAt ?? null,
      dedupeKey: `reminder:${params.appointmentId}`,
    });
  }

  /** Enqueue a 2-day post-visit follow-up SMS (once only). */
  async sendFollowUp(params: {
    appointmentId: string;
    patientId: string;
    phone?: string | null;
    patientName: string;
  }): Promise<EnqueueResult> {
    const normalized = params.phone ? normalizeNigerianPhone(params.phone) : null;
    if (!normalized) return { ok: false, error: 'Invalid phone number' };
    return this.provider.enqueue({
      channel: 'sms',
      type: 'follow_up',
      recipient: normalized,
      message: followUpSMS(params.patientName),
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      dedupeKey: `followup:${params.appointmentId}`,
    });
  }

  /** Enqueue a welcome email for a newly registered patient. */
  async sendWelcome(params: {
    patientId: string;
    email: string;
    patientName: string;
  }): Promise<EnqueueResult> {
    const { subject, body } = welcomeEmail(params.patientName);
    return this.provider.enqueue({
      channel: 'email',
      type: 'welcome',
      recipient: params.email,
      subject,
      message: body,
      patientId: params.patientId,
      dedupeKey: `welcome:${params.patientId}`,
    });
  }

  /** Notify a patient (email) that a lab result is ready — no PHI in the message. */
  async sendLabResultReady(params: {
    patientId: string;
    email: string;
    patientName: string;
    resultId: string;
  }): Promise<EnqueueResult> {
    const { subject, body } = labResultEmail(params.patientName);
    return this.provider.enqueue({
      channel: 'email',
      type: 'lab_result',
      recipient: params.email,
      subject,
      message: body,
      patientId: params.patientId,
      dedupeKey: `lab:${params.resultId}`,
    });
  }
}

/** Singleton wired to the default Supabase-backed provider. */
export const notificationService = new NotificationService(
  new SupabaseNotificationProvider(),
);
