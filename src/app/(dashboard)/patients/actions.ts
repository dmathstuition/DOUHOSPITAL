'use server';

import ExcelJS from 'exceljs';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { can, ROLES } from '@/lib/rbac';
import { patientSchema, type PatientInput } from '@/lib/validation/patient';
import { searchPatients } from '@/lib/data/patients';
import { siteConfig } from '@/lib/config';
import { formatNigerianPhone } from '@/lib/utils/phone';

/** Map a validated patient input to the DB row shape (shared by create/update). */
function toPatientRow(v: PatientInput) {
  return {
    first_name: v.first_name,
    last_name: v.last_name,
    middle_name: v.middle_name || null,
    sex: v.sex ?? null,
    age: v.age ?? null,
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
    notes: v.doctor_notes || null,
  };
}

/** BMI from weight (kg) + height (cm), rounded to 1dp; null if incomputable. */
function toBmi(weight?: number, height?: number): number | null {
  if (!weight || !height) return null;
  const m = height / 100;
  if (m <= 0) return null;
  return Math.round((weight / (m * m)) * 10) / 10;
}

/**
 * Record the vital signs captured on the registration form as an initial
 * dated reading in vital_signs. Best-effort: the patient is already saved, and
 * we use the service-role client so any authorized registrar (including a
 * receptionist, who cannot write vital_signs under RLS) can capture them.
 */
async function recordRegistrationVitals(patientId: string, userId: string, v: PatientInput) {
  const hasVitals =
    !!v.blood_pressure ||
    v.temperature != null ||
    v.weight != null ||
    v.height != null ||
    v.pulse != null;
  if (!hasVitals) return;
  try {
    const admin = createAdminClient();
    await admin.from('vital_signs').insert({
      patient_id: patientId,
      recorded_by: userId,
      blood_pressure: v.blood_pressure || null,
      temperature: v.temperature ?? null,
      weight: v.weight ?? null,
      height: v.height ?? null,
      pulse: v.pulse ?? null,
      bmi: toBmi(v.weight, v.height),
    });
  } catch {
    // vitals capture is best-effort; never fail the registration over it
  }
}

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Register a new patient. Authorization is enforced three ways:
 *   1. getCurrentUser + RBAC capability check (server-side)
 *   2. Supabase RLS on the insert (uses the caller's session)
 *   3. Zod validation of the payload
 */
export async function createPatientAction(input: PatientInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' };
  if (!can(user.role, 'REGISTER_PATIENT')) {
    return { ok: false, error: 'You are not authorized to register patients.' };
  }

  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .insert(toPatientRow(parsed.data))
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'A patient with that matric number already exists.' };
    }
    return { ok: false, error: 'Unable to register the patient. Please try again.' };
  }

  await recordRegistrationVitals(data.id, user.id, parsed.data);

  revalidatePath('/patients');
  return { ok: true, id: data.id };
}

/** Update an existing patient's details. */
export async function updatePatientAction(
  id: string,
  input: PatientInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' };
  if (!can(user.role, 'REGISTER_PATIENT')) {
    return { ok: false, error: 'You are not authorized to edit patients.' };
  }

  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please correct the highlighted fields.', fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('patients')
    .update(toPatientRow(parsed.data))
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'A patient with that matric number already exists.' };
    }
    return { ok: false, error: 'Unable to save changes. Please try again.' };
  }

  // If fresh vitals were entered on the form, record them as a new reading.
  await recordRegistrationVitals(id, user.id, parsed.data);

  revalidatePath('/patients');
  revalidatePath(`/patients/${id}`);
  return { ok: true, id };
}

/**
 * Delete a patient (super admin only). Uses a SOFT delete — the record is
 * marked deleted and hidden from all lists, but appointments, prescriptions and
 * other history are preserved (never orphaned). Fully clearing records is a
 * controlled, audited operation done at the database level if ever needed.
 */
export async function deletePatientAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' };
  if (user.role !== ROLES.SUPER_ADMIN) {
    return { ok: false, error: 'Only an administrator can delete patients.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', id);

  if (error) return { ok: false, error: 'Unable to delete the patient.' };

  revalidatePath('/patients');
  return { ok: true, id };
}

export interface PatientExportResult {
  ok: boolean;
  error?: string;
  filename?: string;
  /** Base64-encoded .xlsx content. */
  base64?: string;
}

/**
 * Export the full patient records database to Excel — demographics, latest
 * vital signs and doctor notes. Authorized administrators only.
 */
export async function exportPatientsAction(query?: string): Promise<PatientExportResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!can(user.role, 'EXPORT_REPORTS')) {
    return { ok: false, error: 'You are not authorized to export patient records.' };
  }

  try {
    const supabase = await createClient();
    let q = supabase
      .from('patients')
      .select('*')
      .is('deleted_at', null)
      .order('last_name', { ascending: true });
    if (query && query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(
        `first_name.ilike.${term},last_name.ilike.${term},matric_number.ilike.${term},patient_code.ilike.${term}`,
      );
    }
    const { data: patients, error } = await q;
    if (error) return { ok: false, error: 'Unable to read patient records.' };

    // Latest vitals per patient (single query, newest first, keep first seen).
    const ids = (patients ?? []).map((p) => p.id);
    const latestVitals = new Map<
      string,
      { blood_pressure: string | null; temperature: number | null; weight: number | null; height: number | null; pulse: number | null; bmi: number | null }
    >();
    if (ids.length > 0) {
      const { data: vitals } = await supabase
        .from('vital_signs')
        .select('patient_id, blood_pressure, temperature, weight, height, pulse, bmi, recorded_at')
        .in('patient_id', ids)
        .order('recorded_at', { ascending: false });
      for (const v of vitals ?? []) {
        if (!latestVitals.has(v.patient_id)) {
          latestVitals.set(v.patient_id, {
            blood_pressure: v.blood_pressure,
            temperature: v.temperature,
            weight: v.weight,
            height: v.height,
            pulse: v.pulse,
            bmi: v.bmi,
          });
        }
      }
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = siteConfig.shortName;
    wb.created = new Date();
    const ws = wb.addWorksheet('Patients');

    const columns = [
      'Patient ID', 'Last Name', 'First Name', 'Middle Name', 'Sex', 'Age',
      'Blood Group', 'Genotype', 'Email', 'Phone', 'Matric Number', 'Address',
      'BP', 'Temp (°C)', 'Weight (kg)', 'Height (cm)', 'Pulse', 'BMI',
      'Doctor Notes', 'Status', 'Registered',
    ];
    ws.mergeCells(1, 1, 1, columns.length);
    const title = ws.getCell(1, 1);
    title.value = `${siteConfig.shortName} — Patient Records`;
    title.font = { bold: true, size: 13 };

    const header = ws.addRow(columns);
    header.font = { bold: true };
    header.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F2EC' } };
    });

    for (const p of patients ?? []) {
      const v = latestVitals.get(p.id);
      ws.addRow([
        p.patient_code,
        p.last_name,
        p.first_name,
        p.middle_name ?? '',
        p.sex ?? '',
        p.age ?? '',
        p.blood_group ?? '',
        p.genotype ?? '',
        p.email ?? '',
        p.phone ? formatNigerianPhone(p.phone) : '',
        p.matric_number ?? '',
        p.address ?? '',
        v?.blood_pressure ?? '',
        v?.temperature ?? '',
        v?.weight ?? '',
        v?.height ?? '',
        v?.pulse ?? '',
        v?.bmi ?? '',
        p.notes ?? '',
        p.status,
        p.registration_date,
      ]);
    }
    ws.columns.forEach((col) => {
      col.width = 16;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const stamp = new Date().toISOString().slice(0, 10);
    return { ok: true, filename: `douhc-patients-${stamp}.xlsx`, base64 };
  } catch {
    return { ok: false, error: 'Unable to generate the export.' };
  }
}

/** Staff patient lookup for booking on behalf of a patient. */
export async function searchPatientsAction(
  query: string,
): Promise<{ id: string; name: string; code: string; matric: string | null }[]> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'SEARCH_PATIENTS')) return [];
  const { rows } = await searchPatients({ query, pageSize: 10 });
  return rows.map((p) => ({
    id: p.id,
    name: `${p.last_name}, ${p.first_name}`,
    code: p.patient_code,
    matric: p.matric_number,
  }));
}
