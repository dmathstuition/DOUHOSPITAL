import { siteConfig } from '@/lib/config';
import { formatDate, formatTime } from '@/lib/utils';

/**
 * Message templates. These render the *content* the notification layer stores;
 * the actual transport (Gmail via Apps Script today, Resend later for email;
 * Termii for SMS) is decoupled from this text.
 */

export interface AppointmentTemplateVars {
  patientName: string;
  date: string; // ISO date
  time: string; // HH:MM
  doctorName: string;
  department: string;
}

export function appointmentConfirmationSMS(v: AppointmentTemplateVars): string {
  return `Hello ${v.patientName}, your appointment at ${siteConfig.shortName} has been booked for ${formatDate(v.date)} at ${formatTime(v.time)} with Dr ${v.doctorName} in ${v.department}.`;
}

export function appointmentReminderSMS(v: AppointmentTemplateVars): string {
  return `Hello ${v.patientName}, reminder: Your appointment at ${siteConfig.shortName} ${v.department} with Dr ${v.doctorName} is tomorrow ${formatDate(v.date)} ${formatTime(v.time)}.`;
}

export function followUpSMS(patientName: string): string {
  return `Hello ${patientName}, this is ${siteConfig.shortName}. How are you feeling? Please reply if you need a follow-up.`;
}

export function appointmentConfirmationEmail(v: AppointmentTemplateVars): {
  subject: string;
  body: string;
} {
  return {
    subject: `Appointment Confirmed — ${siteConfig.shortName}`,
    body: [
      `Dear ${v.patientName},`,
      '',
      `Your appointment at ${siteConfig.name} has been confirmed.`,
      '',
      `  Date:        ${formatDate(v.date)}`,
      `  Time:        ${formatTime(v.time)}`,
      `  Doctor:      Dr ${v.doctorName}`,
      `  Department:  ${v.department}`,
      '',
      'Please arrive 10 minutes early and bring your student/patient ID.',
      '',
      `Regards,`,
      `${siteConfig.name}`,
      `${siteConfig.contact.phone}`,
    ].join('\n'),
  };
}

export function welcomeEmail(patientName: string): { subject: string; body: string } {
  return {
    subject: `Welcome to ${siteConfig.shortName}`,
    body: [
      `Dear ${patientName},`,
      '',
      `Welcome to ${siteConfig.name}. Your patient record has been created.`,
      'You can now book appointments and view your health information through the patient portal.',
      '',
      `Regards,`,
      `${siteConfig.name}`,
    ].join('\n'),
  };
}

export function labResultEmail(patientName: string): { subject: string; body: string } {
  return {
    subject: `Laboratory Result Available — ${siteConfig.shortName}`,
    body: [
      `Dear ${patientName},`,
      '',
      'A new laboratory result is available in your patient portal.',
      'For your privacy, results are not included in this message. Please log in to view them securely.',
      '',
      `Regards,`,
      `${siteConfig.name}`,
    ].join('\n'),
  };
}
