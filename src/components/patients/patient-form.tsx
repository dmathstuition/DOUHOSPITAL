'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { patientSchema, type PatientInput, bloodGroups, genotypes } from '@/lib/validation/patient';
import { createPatientAction } from '@/app/(dashboard)/patients/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PatientForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PatientInput>({ resolver: zodResolver(patientSchema) });

  async function onSubmit(values: PatientInput) {
    setServerError(null);
    const res = await createPatientAction(values);
    if (res.ok && res.id) {
      router.push(`/patients/${res.id}`);
      router.refresh();
      return;
    }
    if (res.fieldErrors) {
      for (const [k, v] of Object.entries(res.fieldErrors)) {
        setError(k as keyof PatientInput, { message: v });
      }
    }
    setServerError(res.error ?? 'Unable to register the patient.');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.first_name?.message} required>
            <Input {...register('first_name')} />
          </Field>
          <Field label="Last name" error={errors.last_name?.message} required>
            <Input {...register('last_name')} />
          </Field>
          <Field label="Middle name" error={errors.middle_name?.message}>
            <Input {...register('middle_name')} />
          </Field>
          <Field label="Sex" error={errors.sex?.message}>
            <Select {...register('sex')} defaultValue="">
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </Field>
          <Field label="Date of birth" error={errors.date_of_birth?.message}>
            <Input type="date" {...register('date_of_birth')} />
          </Field>
          <Field label="Blood group" error={errors.blood_group?.message}>
            <Select {...register('blood_group')} defaultValue="">
              <option value="">Select…</option>
              {bloodGroups.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="Genotype" error={errors.genotype?.message}>
            <Select {...register('genotype')} defaultValue="">
              <option value="">Select…</option>
              {genotypes.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact & student information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input inputMode="tel" placeholder="08012345678" {...register('phone')} />
          </Field>
          <Field label="Matric number" error={errors.matric_number?.message}>
            <Input {...register('matric_number')} />
          </Field>
          <Field label="Student ID" error={errors.student_id?.message}>
            <Input {...register('student_id')} />
          </Field>
          <Field label="Faculty" error={errors.faculty?.message}>
            <Input {...register('faculty')} />
          </Field>
          <Field label="Department" error={errors.department?.message}>
            <Input {...register('department')} />
          </Field>
          <Field label="Level" error={errors.level?.message}>
            <Input placeholder="e.g. 200" {...register('level')} />
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <Input {...register('address')} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" error={errors.emergency_contact_name?.message}>
            <Input {...register('emergency_contact_name')} />
          </Field>
          <Field label="Contact phone" error={errors.emergency_contact_phone?.message}>
            <Input inputMode="tel" placeholder="08012345678" {...register('emergency_contact_phone')} />
          </Field>
        </CardContent>
      </Card>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Register Patient
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
