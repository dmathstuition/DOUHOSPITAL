import { z } from 'zod';

const timeRe = /^\d{2}:\d{2}$/;

export const bookingSchema = z.object({
  department_id: z.string().uuid('Select a department'),
  doctor_id: z.string().uuid('Select a doctor'),
  appointment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date'),
  start_time: z.string().regex(timeRe, 'Select a time'),
  reason: z.string().max(500).optional().or(z.literal('')),
  // Optional: when a staff member books on behalf of a patient.
  patient_id: z.string().uuid().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'in_consultation',
  'completed',
  'cancelled',
  'no_show',
] as const;

export const rescheduleSchema = z.object({
  id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(timeRe),
});
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
