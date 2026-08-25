'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { isStaff } from '@/lib/rbac';
import { getAvailableSlots, getDoctorsByDepartment } from '@/lib/data/appointments';
import type { Slot } from '@/lib/appointments/slots';
import { bookingSchema, type BookingInput } from '@/lib/validation/appointment';
import { notificationService } from '@/lib/notifications';
import type { AppointmentStatus } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Resolve the patient id to book for: explicit (staff) or the caller's own. */
async function resolvePatientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  explicit: string | undefined,
  staff: boolean,
): Promise<string | null> {
  if (staff && explicit) return explicit;
  const { data } = await supabase
    .from('patients')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

/**
 * Book an appointment. Server re-validates slot availability (never trusts the
 * client), lets the DB unique index + trigger guard against races and invalid
 * slots, then enqueues confirmation notifications.
 */
export async function createAppointmentAction(input: BookingInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' };

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please complete all required fields.', fieldErrors };
  }
  const v = parsed.data;
  const staff = isStaff(user.role);
  const supabase = await createClient();

  const patientId = await resolvePatientId(supabase, user.id, v.patient_id, staff);
  if (!patientId) {
    return {
      ok: false,
      error: 'No patient record is linked to your account. Please contact reception.',
    };
  }

  // Re-derive the slot server-side; reject anything not currently available.
  const slots = await getAvailableSlots(v.doctor_id, v.appointment_date);
  const slot = slots.find((s) => s.start === v.start_time);
  if (!slot) {
    return { ok: false, error: 'That appointment slot is no longer available.' };
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      doctor_id: v.doctor_id,
      department_id: v.department_id,
      appointment_date: v.appointment_date,
      start_time: v.start_time,
      end_time: slot.end,
      reason: v.reason || null,
      status: staff ? 'confirmed' : 'pending',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    // 23505 = someone booked this slot first.
    if (error.code === '23505') {
      return { ok: false, error: 'That appointment slot is no longer available.' };
    }
    return { ok: false, error: 'Unable to book the appointment. Please try again.' };
  }

  await enqueueConfirmation(supabase, data.id, patientId, v.doctor_id, v.department_id, v.appointment_date, v.start_time);

  revalidatePath('/dashboard/appointments');
  revalidatePath('/portal');
  return { ok: true, id: data.id };
}

async function enqueueConfirmation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appointmentId: string,
  patientId: string,
  doctorId: string,
  departmentId: string,
  date: string,
  time: string,
) {
  try {
    const [{ data: patient }, { data: doctor }, { data: department }] = await Promise.all([
      supabase.from('patients').select('first_name, last_name, phone, email').eq('id', patientId).maybeSingle<{ first_name: string; last_name: string; phone: string | null; email: string | null }>(),
      supabase.from('doctors').select('full_name').eq('id', doctorId).maybeSingle<{ full_name: string }>(),
      supabase.from('departments').select('name').eq('id', departmentId).maybeSingle<{ name: string }>(),
    ]);
    if (!patient) return;
    await notificationService.sendAppointmentConfirmation({
      appointmentId,
      patientId,
      phone: patient.phone,
      email: patient.email,
      vars: {
        patientName: `${patient.first_name} ${patient.last_name}`,
        date,
        time,
        doctorName: doctor?.full_name ?? 'Doctor',
        department: department?.name ?? 'Clinic',
      },
    });
  } catch {
    // Notification enqueue failures must not fail the booking itself.
  }
}

/** Wizard read: active doctors in a department. */
export async function fetchDoctorsAction(
  departmentId: string,
): Promise<{ id: string; full_name: string; specialization: string | null }[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return getDoctorsByDepartment(departmentId);
}

/** Wizard read: available slots for a doctor on a date. */
export async function fetchSlotsAction(
  doctorId: string,
  date: string,
): Promise<Slot[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return getAvailableSlots(doctorId, date);
}

/** Staff-only status transition. */
export async function updateAppointmentStatusAction(
  id: string,
  status: AppointmentStatus,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };
  if (!isStaff(user.role)) return { ok: false, error: 'Not authorized.' };

  const supabase = await createClient();
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'Unable to update the appointment.' };

  revalidatePath('/dashboard/appointments');
  return { ok: true, id };
}

/** Patient (or staff) cancels an appointment. RLS restricts patients to own. */
export async function cancelAppointmentAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) return { ok: false, error: 'Unable to cancel the appointment.' };

  revalidatePath('/portal');
  revalidatePath('/dashboard/appointments');
  return { ok: true, id };
}
