import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PatientForm } from '@/components/patients/patient-form';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getPatient } from '@/lib/data/patients';

export const metadata: Metadata = { title: 'Edit Patient' };

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'REGISTER_PATIENT')) redirect('/dashboard');

  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/patients/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to patient
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Edit {patient.first_name} {patient.last_name}
        </h1>
        <p className="text-muted-foreground">Update this patient&apos;s details.</p>
      </div>
      <PatientForm patient={patient} />
    </div>
  );
}
