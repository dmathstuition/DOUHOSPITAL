import { z } from 'zod';
import { isValidNigerianPhone, normalizeNigerianPhone } from '@/lib/utils/phone';

const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || isValidNigerianPhone(v), 'Enter a valid Nigerian phone number')
  .transform((v) => (v ? (normalizeNigerianPhone(v) ?? v) : undefined));

export const doctorSchema = z.object({
  full_name: z.string().min(2, "Doctor's name is required").max(120),
  department_id: z.string().uuid('Select a department').optional().or(z.literal('')),
  specialization: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: optionalPhone,
  photo_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  biography: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type DoctorInput = z.infer<typeof doctorSchema>;

// Weekly schedule entry
export const scheduleSchema = z
  .object({
    day_of_week: z.coerce.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
    consultation_minutes: z.coerce.number().int().min(5).max(240).default(30),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
  });

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
