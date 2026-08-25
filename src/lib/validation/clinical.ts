import { z } from 'zod';

/** Optional numeric field from a form: '' / null / undefined -> undefined. */
function optionalNumber(opts: { int?: boolean; min?: number; max?: number } = {}) {
  return z.preprocess(
    (v) =>
      v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
        ? undefined
        : v,
    (() => {
      let s = z.coerce.number();
      if (opts.int) s = s.int();
      if (opts.min !== undefined) s = s.min(opts.min);
      if (opts.max !== undefined) s = s.max(opts.max);
      return s.optional();
    })(),
  );
}

/* ----------------------------- Consultations ----------------------------- */
export const consultationSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional().or(z.literal('')),
  symptoms: z.string().max(2000).optional().or(z.literal('')),
  examination: z.string().max(2000).optional().or(z.literal('')),
  diagnosis: z.string().max(2000).optional().or(z.literal('')),
  treatment_plan: z.string().max(2000).optional().or(z.literal('')),
  doctor_notes: z.string().max(2000).optional().or(z.literal('')),
  follow_up_date: z.string().optional().or(z.literal('')),
});
export type ConsultationInput = z.infer<typeof consultationSchema>;

/* ------------------------------ Vital signs ------------------------------ */
export const vitalsSchema = z.object({
  patient_id: z.string().uuid(),
  blood_pressure: z.string().max(20).optional().or(z.literal('')),
  temperature: optionalNumber({ min: 30, max: 45 }),
  weight: optionalNumber({ min: 0, max: 500 }),
  height: optionalNumber({ min: 0, max: 300 }),
  pulse: optionalNumber({ int: true, min: 0, max: 300 }),
  respiratory_rate: optionalNumber({ int: true, min: 0, max: 120 }),
  oxygen_saturation: optionalNumber({ int: true, min: 0, max: 100 }),
});
export type VitalsInput = z.infer<typeof vitalsSchema>;

/* ----------------------------- Prescriptions ----------------------------- */
export const prescriptionItemSchema = z.object({
  medication_name: z.string().min(1, 'Medication is required').max(160),
  dosage: z.string().max(80).optional().or(z.literal('')),
  frequency: z.string().max(80).optional().or(z.literal('')),
  duration: z.string().max(80).optional().or(z.literal('')),
  route: z.string().max(60).optional().or(z.literal('')),
  instructions: z.string().max(300).optional().or(z.literal('')),
  quantity: optionalNumber({ int: true, min: 0, max: 1000 }),
});

export const prescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  diagnosis: z.string().max(500).optional().or(z.literal('')),
  items: z.array(prescriptionItemSchema).min(1, 'Add at least one medication'),
});
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;

/* ------------------------------- Laboratory ------------------------------ */
export const labRequestSchema = z.object({
  patient_id: z.string().uuid(),
  test_name: z.string().min(2, 'Test name is required').max(160),
  clinical_reason: z.string().max(500).optional().or(z.literal('')),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
});
export type LabRequestInput = z.infer<typeof labRequestSchema>;

export const labResultSchema = z.object({
  test_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  result_summary: z.string().max(2000).optional().or(z.literal('')),
  reference_range: z.string().max(200).optional().or(z.literal('')),
  interpretation: z.string().max(500).optional().or(z.literal('')),
  comments: z.string().max(500).optional().or(z.literal('')),
});
export type LabResultInput = z.infer<typeof labResultSchema>;

/* ------------------------------- Medications ----------------------------- */
export const medicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(160),
  category: z.string().max(80).optional().or(z.literal('')),
  batch_number: z.string().max(80).optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(0).max(1000000),
  expiry_date: z.string().optional().or(z.literal('')),
  reorder_level: z.coerce.number().int().min(0).max(100000),
  supplier: z.string().max(160).optional().or(z.literal('')),
  price: optionalNumber({ min: 0, max: 1000000 }),
});
export type MedicationInput = z.infer<typeof medicationSchema>;
