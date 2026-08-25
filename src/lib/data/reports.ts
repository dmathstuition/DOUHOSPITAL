import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { calculateAge } from '@/lib/utils';

export type ReportType = 'registrations' | 'appointments';

export interface ReportFilters {
  from?: string;
  to?: string;
  departmentId?: string;
  doctorId?: string;
}

export interface ReportResult {
  columns: string[];
  rows: (string | number)[][];
  title: string;
}

function range(filters: ReportFilters) {
  const to = filters.to || new Date().toISOString().slice(0, 10);
  const from =
    filters.from ||
    (() => {
      const d = new Date(to);
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();
  return { from, to };
}

/** Patient registrations in a date range. Demographics only — no clinical data. */
export async function registrationsReport(filters: ReportFilters): Promise<ReportResult> {
  const { from, to } = range(filters);
  const supabase = await createClient();
  const { data } = await supabase
    .from('patients')
    .select(
      'patient_code, first_name, last_name, sex, date_of_birth, blood_group, genotype, email, phone, matric_number, department, faculty, registration_date',
    )
    .is('deleted_at', null)
    .gte('registration_date', from)
    .lte('registration_date', to)
    .order('registration_date', { ascending: false })
    .limit(5000);

  const rows = (data ?? []).map((p) => [
    p.patient_code,
    `${p.last_name}, ${p.first_name}`,
    p.sex ?? '',
    calculateAge(p.date_of_birth) ?? '',
    p.blood_group ?? '',
    p.genotype ?? '',
    p.email ?? '',
    p.phone ?? '',
    p.matric_number ?? '',
    p.department ?? '',
    p.faculty ?? '',
    p.registration_date,
  ]);

  return {
    title: `Patient Registrations ${from} to ${to}`,
    columns: [
      'Patient ID', 'Name', 'Sex', 'Age', 'Blood Group', 'Genotype',
      'Email', 'Phone', 'Matric Number', 'Department', 'Faculty', 'Registration Date',
    ],
    rows,
  };
}

/** Appointments in a date range, optionally filtered by department / doctor. */
export async function appointmentsReport(filters: ReportFilters): Promise<ReportResult> {
  const { from, to } = range(filters);
  const supabase = await createClient();
  let q = supabase
    .from('appointments')
    .select(
      `appointment_date, start_time, status, reason,
       patients:patient_id ( first_name, last_name, patient_code ),
       doctors:doctor_id ( full_name ),
       departments:department_id ( name )`,
    )
    .gte('appointment_date', from)
    .lte('appointment_date', to)
    .order('appointment_date', { ascending: false })
    .limit(5000);

  if (filters.departmentId) q = q.eq('department_id', filters.departmentId);
  if (filters.doctorId) q = q.eq('doctor_id', filters.doctorId);

  const { data } = await q;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) ?? []).map((a) => [
    a.appointment_date,
    (a.start_time ?? '').slice(0, 5),
    a.patients ? `${a.patients.last_name}, ${a.patients.first_name}` : '',
    a.patients?.patient_code ?? '',
    a.doctors?.full_name ?? '',
    a.departments?.name ?? '',
    a.status,
    a.reason ?? '',
  ]);

  return {
    title: `Appointments ${from} to ${to}`,
    columns: ['Date', 'Time', 'Patient', 'Patient ID', 'Doctor', 'Department', 'Status', 'Reason'],
    rows,
  };
}

export async function runReport(type: ReportType, filters: ReportFilters): Promise<ReportResult> {
  return type === 'appointments'
    ? appointmentsReport(filters)
    : registrationsReport(filters);
}
