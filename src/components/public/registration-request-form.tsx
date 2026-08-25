'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import {
  registrationRequestSchema,
  type RegistrationRequestInput,
} from '@/lib/validation/registration';
import { bloodGroups, genotypes } from '@/lib/validation/patient';
import { submitRegistrationRequestAction } from '@/app/(public)/register/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RegistrationRequestForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationRequestInput>({ resolver: zodResolver(registrationRequestSchema) });

  async function onSubmit(values: RegistrationRequestInput) {
    setServerError(null);
    const res = await submitRegistrationRequestAction(values);
    if (res.ok) {
      setDone(true);
      return;
    }
    if (res.fieldErrors) {
      for (const [k, v] of Object.entries(res.fieldErrors)) {
        setError(k as keyof RegistrationRequestInput, { message: v });
      }
    }
    setServerError(res.error ?? 'Unable to submit your request.');
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="h-14 w-14 text-success" />
          <h2 className="mt-4 text-xl font-semibold">Request received</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Thank you. Your registration request has been sent to the health center.
            Our staff will complete your registration and contact you if anything
            else is needed. Please visit the health center on your next appointment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardHeader><CardTitle className="text-base">Personal details</CardTitle></CardHeader>
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
              {bloodGroups.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Genotype" error={errors.genotype?.message}>
            <Select {...register('genotype')} defaultValue="">
              <option value="">Select…</option>
              {genotypes.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Contact & student information</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="text-base">Emergency contact</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" error={errors.emergency_contact_name?.message}>
            <Input {...register('emergency_contact_name')} />
          </Field>
          <Field label="Contact phone" error={errors.emergency_contact_phone?.message}>
            <Input inputMode="tel" placeholder="08012345678" {...register('emergency_contact_phone')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Anything we should know? (optional)" error={errors.note?.message}>
              <Input {...register('note')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />} Submit request
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
