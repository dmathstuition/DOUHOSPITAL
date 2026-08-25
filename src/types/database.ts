/**
 * Supabase database types.
 *
 * In a live project these are generated via:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * This hand-authored version mirrors the schema in `supabase/migrations` and
 * covers the tables the application code queries directly. It is kept in sync
 * with the migrations manually until generation is wired into CI.
 *
 * NOTE: Row types are `type` aliases (not `interface`) so they carry the
 * implicit index signature Supabase's generic client machinery requires.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'super_admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'patient';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type NotificationChannel = 'sms' | 'email';
export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled';

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
};

export type PatientRow = Timestamps & {
  id: string;
  patient_code: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  sex: 'male' | 'female' | null;
  date_of_birth: string | null;
  blood_group: string | null;
  genotype: string | null;
  email: string | null;
  phone: string | null;
  matric_number: string | null;
  student_id: string | null;
  faculty: string | null;
  department: string | null;
  level: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  registration_date: string;
  status: 'active' | 'inactive';
  deleted_at: string | null;
};

export type DepartmentRow = Timestamps & {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  opening_hours: string | null;
  status: 'active' | 'inactive';
};

export type DoctorRow = Timestamps & {
  id: string;
  profile_id: string | null;
  full_name: string;
  photo_url: string | null;
  department_id: string | null;
  specialization: string | null;
  email: string | null;
  phone: string | null;
  biography: string | null;
  status: 'active' | 'inactive';
};

export type DoctorScheduleRow = Timestamps & {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0=Sunday..6=Saturday
  start_time: string;
  end_time: string;
  consultation_minutes: number;
  is_active: boolean;
};

export type AppointmentRow = Timestamps & {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: AppointmentStatus;
  reminder_sent: boolean;
  follow_up_sent: boolean;
  created_by: string | null;
};

export type VitalSignRow = {
  id: string;
  patient_id: string;
  recorded_by: string | null;
  blood_pressure: string | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  pulse: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  bmi: number | null;
  recorded_at: string;
};

export type NotificationRow = {
  id: string;
  patient_id: string | null;
  appointment_id: string | null;
  channel: NotificationChannel;
  notification_type: string;
  recipient: string;
  subject: string | null;
  message: string | null;
  status: NotificationStatus;
  provider: string | null;
  provider_message_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  retry_count: number;
  error_message: string | null;
  dedupe_key: string | null;
  payload: Json;
  created_at: string;
};

export type PrescriptionRow = Timestamps & {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  record_id: string | null;
  diagnosis: string | null;
  status: 'active' | 'completed' | 'cancelled';
  dispense_state: 'pending' | 'partial' | 'dispensed';
};

export type SystemSettingRow = {
  key: string;
  value: Json;
  updated_at: string;
};

export type MedicalAlertRow = Timestamps & {
  id: string;
  patient_id: string;
  alert_type: 'drug_allergy' | 'severe_allergy' | 'condition';
  description: string;
  created_by: string | null;
};

export type WaitingQueueRow = {
  id: string;
  patient_id: string;
  queue_number: string;
  status:
    | 'waiting'
    | 'called'
    | 'with_nurse'
    | 'waiting_for_doctor'
    | 'in_consultation'
    | 'completed';
  checked_in_at: string;
  completed_at: string | null;
  created_by: string | null;
};

type TableShape<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      patients: TableShape<PatientRow>;
      departments: TableShape<DepartmentRow>;
      doctors: TableShape<DoctorRow>;
      doctor_schedules: TableShape<DoctorScheduleRow>;
      appointments: TableShape<AppointmentRow>;
      prescriptions: TableShape<PrescriptionRow>;
      vital_signs: TableShape<VitalSignRow>;
      notifications: TableShape<NotificationRow>;
      system_settings: TableShape<SystemSettingRow>;
      medical_alerts: TableShape<MedicalAlertRow>;
      waiting_queue: TableShape<WaitingQueueRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      appointment_status: AppointmentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
