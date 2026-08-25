import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  MedicalRecordRow,
  PrescriptionRow,
  PrescriptionItemRow,
  MedicationRow,
  LaboratoryTestRow,
  LaboratoryResultRow,
} from '@/types/database';

/* ------------------------------ Consultations ---------------------------- */
export async function getPatientRecords(patientId: string): Promise<MedicalRecordRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as MedicalRecordRow[];
}

export interface RecentRecord extends MedicalRecordRow {
  patient_name: string;
}

export async function listRecentRecords(): Promise<RecentRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('medical_records')
    .select('*, patients:patient_id ( first_name, last_name )')
    .order('created_at', { ascending: false })
    .limit(50);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((r) => ({
    ...r,
    patient_name: r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : 'Unknown',
  }));
}

/* ------------------------------ Prescriptions ---------------------------- */
export interface PrescriptionListItem extends PrescriptionRow {
  patient_name: string;
  item_count: number;
}

export async function listPrescriptions(): Promise<PrescriptionListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('prescriptions')
    .select(
      `*, patients:patient_id ( first_name, last_name ),
       prescription_items ( id )`,
    )
    .order('created_at', { ascending: false })
    .limit(50);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((p) => ({
    ...p,
    patient_name: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : 'Unknown',
    item_count: Array.isArray(p.prescription_items) ? p.prescription_items.length : 0,
  }));
}

export async function getPrescription(id: string): Promise<{
  prescription: (PrescriptionRow & { patient_name: string; patient_code: string }) | null;
  items: PrescriptionItemRow[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('prescriptions')
    .select('*, patients:patient_id ( first_name, last_name, patient_code )')
    .eq('id', id)
    .maybeSingle();
  if (!data) return { prescription: null, items: [] };

  const { data: items } = await supabase
    .from('prescription_items')
    .select('*')
    .eq('prescription_id', id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any;
  return {
    prescription: {
      ...p,
      patient_name: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : 'Unknown',
      patient_code: p.patients?.patient_code ?? '—',
    },
    items: (items ?? []) as PrescriptionItemRow[],
  };
}

/* -------------------------------- Pharmacy ------------------------------- */
export async function listMedications(): Promise<MedicationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('medications')
    .select('*')
    .order('name', { ascending: true });
  return (data ?? []) as MedicationRow[];
}

/* ------------------------------- Laboratory ------------------------------ */
export interface LabTestListItem extends LaboratoryTestRow {
  patient_name: string;
  has_result: boolean;
  result_file_path: string | null;
}

export async function listLabTests(): Promise<LabTestListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('laboratory_tests')
    .select(
      `*, patients:patient_id ( first_name, last_name ),
       laboratory_results ( id, file_path )`,
    )
    .order('created_at', { ascending: false })
    .limit(50);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((t) => {
    const result = Array.isArray(t.laboratory_results) ? t.laboratory_results[0] : null;
    return {
      ...t,
      patient_name: t.patients ? `${t.patients.first_name} ${t.patients.last_name}` : 'Unknown',
      has_result: !!result,
      result_file_path: result?.file_path ?? null,
    };
  });
}

export async function getLabResult(testId: string): Promise<LaboratoryResultRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('laboratory_results')
    .select('*')
    .eq('test_id', testId)
    .maybeSingle<LaboratoryResultRow>();
  return data ?? null;
}
