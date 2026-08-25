import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PatientForm } from '@/components/patients/patient-form';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const metadata: Metadata = { title: 'Register Patient' };

export default async function NewPatientPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'REGISTER_PATIENT')) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to patients
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Register Patient</h1>
        <p className="text-muted-foreground">
          Enter the patient&apos;s demographic and contact details. A patient ID is
          generated automatically.
        </p>
      </div>
      <PatientForm />
    </div>
  );
}
