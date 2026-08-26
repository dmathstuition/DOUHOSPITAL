import { z } from 'zod';
import { isValidNigerianPhone, normalizeNigerianPhone } from '@/lib/utils/phone';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const genotypes = ['AA', 'AS', 'SS', 'AC', 'SC'] as const;

const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || isValidNigerianPhone(v), 'Enter a valid Nigerian phone number')
  .transform((v) => (v ? (normalizeNigerianPhone(v) ?? v) : undefined));

/** Optional numeric field from a text input: '' / undefined -> undefined. */
function optionalNumber(opts: { int?: boolean; min?: number; max?: number } = {}) {
  return z.preprocess(
    (v) =>
      v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
        ? undefined
        : v,
    (() => {
      let s = z.coerce.number();
      if (opts.int) s = s.int();
      if (opts.min !== undefined) s = s.min(opts.min);
      if (opts.max !== undefined) s = s.max(opts.max);
      return s.optional();
    })(),
  );
}

export const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(80),
  last_name: z.string().min(1, 'Last name is required').max(80),
  middle_name: z.string().max(80).optional().or(z.literal('')),
  sex: z.enum(['male', 'female']).optional(),
  age: optionalNumber({ int: true, min: 0, max: 150 }),
  date_of_birth: z.string().optional().or(z.literal('')),
  blood_group: z.enum(bloodGroups).optional(),
  genotype: z.enum(genotypes).optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: optionalPhone,
  matric_number: z.string().max(40).optional().or(z.literal('')),
  student_id: z.string().max(40).optional().or(z.literal('')),
  faculty: z.string().max(120).optional().or(z.literal('')),
  department: z.string().max(120).optional().or(z.literal('')),
  level: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  emergency_contact_name: z.string().max(120).optional().or(z.literal('')),
  emergency_contact_phone: optionalPhone,
  // Doctor's note kept on the patient record.
  doctor_notes: z.string().max(2000).optional().or(z.literal('')),
  // Vital signs recorded at registration -> stored as an initial reading.
  blood_pressure: z.string().max(20).optional().or(z.literal('')),
  temperature: optionalNumber({ min: 30, max: 45 }),
  weight: optionalNumber({ min: 0, max: 500 }),
  height: optionalNumber({ min: 0, max: 300 }),
  pulse: optionalNumber({ int: true, min: 0, max: 300 }),
});

export type PatientInput = z.infer<typeof patientSchema>;

export { bloodGroups, genotypes };
