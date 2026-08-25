'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { can, isStaff } from '@/lib/rbac';
import { labRequestSchema, labResultSchema, type LabRequestInput } from '@/lib/validation/clinical';
import type { LaboratoryTestRow } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  url?: string;
}

const ALLOWED = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} as const;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Doctor requests a lab test. */
export async function createLabRequestAction(input: LabRequestInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'REQUEST_LAB')) {
    return { ok: false, error: 'Only doctors can request laboratory tests.' };
  }

  const parsed = labRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle<{ id: string }>();

  const { data, error } = await supabase
    .from('laboratory_tests')
    .insert({
      patient_id: v.patient_id,
      doctor_id: doctor?.id ?? null,
      test_name: v.test_name,
      clinical_reason: v.clinical_reason || null,
      priority: v.priority,
      status: 'requested',
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: 'Unable to submit the lab request.' };

  revalidatePath('/dashboard/laboratory');
  revalidatePath(`/patients/${v.patient_id}`);
  return { ok: true, id: data.id };
}

/** Lab/nurse/admin updates the workflow status of a test. */
export async function updateLabStatusAction(
  id: string,
  status: LaboratoryTestRow['status'],
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return { ok: false, error: 'Not authorized.' };

  const supabase = await createClient();
  const { error } = await supabase.from('laboratory_tests').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'Unable to update the test status.' };

  revalidatePath('/dashboard/laboratory');
  return { ok: true };
}

/**
 * Save a lab result, optionally with an uploaded file. The file is validated
 * (type, extension, size), stored in the PRIVATE `lab-results` bucket under the
 * patient's folder, and never made public.
 */
export async function saveLabResultAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return { ok: false, error: 'Not authorized.' };

  const parsed = labResultSchema.safeParse({
    test_id: formData.get('test_id'),
    patient_id: formData.get('patient_id'),
    result_summary: formData.get('result_summary') ?? '',
    reference_range: formData.get('reference_range') ?? '',
    interpretation: formData.get('interpretation') ?? '',
    comments: formData.get('comments') ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid result.' };
  }
  const v = parsed.data;

  let filePath: string | null = null;
  const file = formData.get('file');
  if (file instanceof File && file.size > 0) {
    const ext = ALLOWED[file.type as keyof typeof ALLOWED];
    if (!ext) return { ok: false, error: 'Only PDF, JPG or PNG files are allowed.' };
    if (file.size > MAX_BYTES) return { ok: false, error: 'File exceeds the 10 MB limit.' };

    const admin = createAdminClient();
    const path = `${v.patient_id}/${v.test_id}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from('lab-results')
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (upErr) return { ok: false, error: 'File upload failed. Please try again.' };
    filePath = path;
  }

  const supabase = await createClient();
  // One result per test: remove any prior row, then insert.
  await supabase.from('laboratory_results').delete().eq('test_id', v.test_id);
  const { error } = await supabase.from('laboratory_results').insert({
    test_id: v.test_id,
    patient_id: v.patient_id,
    result_summary: v.result_summary || null,
    reference_range: v.reference_range || null,
    interpretation: v.interpretation || null,
    comments: v.comments || null,
    file_path: filePath,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: 'Unable to save the result.' };

  await supabase.from('laboratory_tests').update({ status: 'reviewed' }).eq('id', v.test_id);

  revalidatePath('/dashboard/laboratory');
  revalidatePath(`/patients/${v.patient_id}`);
  return { ok: true };
}

/** Generate a short-lived signed URL for a stored result file (staff). */
export async function getLabFileUrlAction(filePath: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) return { ok: false, error: 'Not authorized.' };

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from('lab-results')
    .createSignedUrl(filePath, 60);
  if (error || !data) return { ok: false, error: 'Unable to open the file.' };
  return { ok: true, url: data.signedUrl };
}
