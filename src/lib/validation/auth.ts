import { z } from 'zod';
import { isValidNigerianPhone } from '@/lib/utils/phone';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name').max(120),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .refine((v) => isValidNigerianPhone(v), 'Enter a valid Nigerian phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetRequestSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
