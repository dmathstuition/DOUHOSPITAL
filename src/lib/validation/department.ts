import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  location: z.string().max(160).optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  opening_hours: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
