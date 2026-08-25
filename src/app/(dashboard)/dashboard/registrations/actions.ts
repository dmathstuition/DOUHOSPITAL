'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getRegistrationRequest } from '@/lib/data/registrations';

export interface ActionResult {
  ok: boolean;
  error?: string;
  patientId?: string;
}

/**
 * Approve a registration request: create the actual patient record from the
 * submitted details and mark the request approved (linked to the new patient).
 * The patient then enters the normal workflow (check-in, doctor assignment).
 */
export async function approveRegistrationAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'REGISTER_PATIENT')) {
    return { ok: false, error: 'You are not authorized to approve registrations.' };
  }

  const req = await getRegistrationRequest(id);
  if (!req) return { ok: false, error: 'Request not found.' };
  if (req.status === 'approved' && req.patient_id) {
    return { ok: true, patientId: req.patient_id };
  }

  const supabase = await createClient();

  // Create the patient (patient_code assigned by DB trigger).
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert({
      first_name: req.first_name,
      last_name: req.last_name,
      middle_name: req.middle_name,
      sex: req.sex,
      date_of_birth: req.date_of_birth,
      blood_group: req.blood_group,
      genotype: req.genotype,
      email: req.email,
      phone: req.phone,
      matric_number: req.matric_number,
      student_id: req.student_id,
      faculty: req.faculty,
      department: req.department,
      level: req.level,
      address: req.address,
      emergency_contact_name: req.emergency_contact_name,
      emergency_contact_phone: req.emergency_contact_phone,
    })
    .select('id')
    .single();

  if (patientError) {
    if (patientError.code === '23505') {
      return { ok: false, error: 'A patient with that matric number already exists.' };
    }
    return { ok: false, error: 'Unable to create the patient record.' };
  }

  await supabase
    .from('registration_requests')
    .update({
      status: 'approved',
      patient_id: patient.id,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  revalidatePath('/dashboard/registrations');
  revalidatePath('/patients');
  return { ok: true, patientId: patient.id };
}

export async function rejectRegistrationAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'REGISTER_PATIENT')) {
    return { ok: false, error: 'Not authorized.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('registration_requests')
    .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: 'Unable to update the request.' };

  revalidatePath('/dashboard/registrations');
  return { ok: true };
}
