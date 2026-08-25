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

export const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(80),
  last_name: z.string().min(1, 'Last name is required').max(80),
  middle_name: z.string().max(80).optional().or(z.literal('')),
  sex: z.enum(['male', 'female']).optional(),
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
});

export type PatientInput = z.infer<typeof patientSchema>;

export { bloodGroups, genotypes };
