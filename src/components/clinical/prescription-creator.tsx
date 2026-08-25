'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PatientPicker, type PickedPatient } from '@/components/shared/patient-picker';
import { createPrescriptionAction } from '@/app/(dashboard)/dashboard/prescriptions/actions';

interface ItemForm {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  quantity: string;
}

interface FormValues {
  diagnosis: string;
  items: ItemForm[];
}

const emptyItem: ItemForm = {
  medication_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  route: '',
  instructions: '',
  quantity: '',
};

export function PrescriptionCreator({ patient: initial }: { patient?: PickedPatient }) {
  const router = useRouter();
  const [patient, setPatient] = useState<PickedPatient | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { diagnosis: '', items: [{ ...emptyItem }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  async function onSubmit(values: FormValues) {
    setError(null);
    if (!patient) {
      setError('Select a patient first.');
      return;
    }
    const res = await createPrescriptionAction({
      patient_id: patient.id,
      diagnosis: values.diagnosis,
      items: values.items.map((it) => ({
        ...it,
        quantity: it.quantity === '' ? undefined : Number(it.quantity),
      })),
    });
    if (res.ok && res.id) {
      router.push(`/dashboard/prescriptions/${res.id}`);
      router.refresh();
    } else {
      setError(res.error ?? 'Unable to create the prescription.');
    }
  }

  return (
    <div className="space-y-6">
      <PatientPicker
        selected={patient}
        onSelect={setPatient}
        onClear={() => setPatient(null)}
      />

      {patient && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Input {...register('diagnosis')} placeholder="e.g. Malaria" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Medications</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                <Plus /> Add medication
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Medication {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        aria-label="Remove medication"
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                  <Input placeholder="Medication name *" {...register(`items.${index}.medication_name`)} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input placeholder="Dosage (e.g. 500mg)" {...register(`items.${index}.dosage`)} />
                    <Input placeholder="Frequency (e.g. TDS)" {...register(`items.${index}.frequency`)} />
                    <Input placeholder="Duration (e.g. 5 days)" {...register(`items.${index}.duration`)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input placeholder="Route (e.g. Oral)" {...register(`items.${index}.route`)} />
                    <Input placeholder="Quantity" type="number" min={0} {...register(`items.${index}.quantity`)} />
                    <Input placeholder="Instructions" {...register(`items.${index}.instructions`)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />} Create prescription
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
