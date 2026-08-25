import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PrescriptionCreator } from '@/components/clinical/prescription-creator';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';

export const metadata: Metadata = { title: 'New Prescription' };

export default async function NewPrescriptionPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_PRESCRIPTION')) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/prescriptions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to prescriptions
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New Prescription</h1>
      </div>
      <PrescriptionCreator />
    </div>
  );
}
