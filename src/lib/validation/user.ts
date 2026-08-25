import { z } from 'zod';
import { ROLES } from '@/lib/rbac';

/** Staff roles an admin can assign (never 'patient' — patients aren't users). */
export const STAFF_ROLE_VALUES = [
  ROLES.SUPER_ADMIN,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.RECEPTIONIST,
] as const;

export const workerSchema = z.object({
  full_name: z.string().min(2, 'Enter the full name').max(120),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Temporary password must be at least 8 characters'),
  role: z.enum(STAFF_ROLE_VALUES),
  specialization: z.string().max(120).optional().or(z.literal('')),
});
export type WorkerInput = z.infer<typeof workerSchema>;
