'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  registrationRequestSchema,
  type RegistrationRequestInput,
} from '@/lib/validation/registration';

export interface SubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Public patient registration request. Validated server-side and stored via the
 * service role (no anonymous table access). Staff review each request and
 * create the actual patient record. This is NOT an account — patients do not
 * log in.
 */
export async function submitRegistrationRequestAction(
  input: RegistrationRequestInput,
): Promise<SubmitResult> {
  const parsed = registrationRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === 'string' && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }
  const v = parsed.data;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('registration_requests').insert({
      first_name: v.first_name,
      last_name: v.last_name,
      middle_name: v.middle_name || null,
      sex: v.sex ?? null,
      date_of_birth: v.date_of_birth || null,
      blood_group: v.blood_group ?? null,
      genotype: v.genotype ?? null,
      email: v.email || null,
      phone: v.phone || null,
      matric_number: v.matric_number || null,
      student_id: v.student_id || null,
      faculty: v.faculty || null,
      department: v.department || null,
      level: v.level || null,
      address: v.address || null,
      emergency_contact_name: v.emergency_contact_name || null,
      emergency_contact_phone: v.emergency_contact_phone || null,
      note: v.note || null,
      status: 'pending',
    });
    if (error) return { ok: false, error: 'Unable to submit your request. Please try again.' };
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Registration is temporarily unavailable. Please visit the health center to register.',
    };
  }
}
