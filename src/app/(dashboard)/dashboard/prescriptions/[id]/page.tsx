import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrintButton } from '@/components/shared/print-button';
import { getCurrentUser } from '@/lib/auth';
import { isStaff } from '@/lib/rbac';
import { getPrescription } from '@/lib/data/clinical';
import { siteConfig } from '@/lib/config';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Prescription' };

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) redirect('/dashboard');

  const { id } = await params;
  const { prescription, items } = await getPrescription(id);
  if (!prescription) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/prescriptions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <PrintButton label="Print prescription" />
      </div>

      <Card>
        <CardContent className="p-8">
          {/* Letterhead */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                DH
              </span>
              <div>
                <p className="font-bold text-primary">{siteConfig.shortName}</p>
                <p className="text-xs text-muted-foreground">{siteConfig.name}</p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{formatDate(prescription.created_at)}</p>
              <p>Rx #{prescription.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 py-4">
            <div>
              <p className="font-semibold">{prescription.patient_name}</p>
              <p className="text-xs text-muted-foreground">{prescription.patient_code}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={prescription.status === 'active' ? 'default' : 'success'}>
                {prescription.status}
              </Badge>
              <Badge
                variant={
                  prescription.dispense_state === 'dispensed'
                    ? 'success'
                    : prescription.dispense_state === 'partial'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {prescription.dispense_state}
              </Badge>
            </div>
          </div>

          {prescription.diagnosis && (
            <p className="pb-4 text-sm">
              <span className="font-medium">Diagnosis:</span> {prescription.diagnosis}
            </p>
          )}

          <div className="mb-2 flex items-baseline gap-2 border-t pt-4">
            <span className="text-2xl font-serif italic text-primary">℞</span>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Medication</th>
                <th className="py-2 pr-3 font-medium">Dosage</th>
                <th className="py-2 pr-3 font-medium">Frequency</th>
                <th className="py-2 pr-3 font-medium">Duration</th>
                <th className="py-2 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-0 align-top">
                  <td className="py-2 pr-3">
                    <p className="font-medium">{it.medication_name}</p>
                    {it.route && <p className="text-xs text-muted-foreground">{it.route}</p>}
                    {it.instructions && (
                      <p className="text-xs text-muted-foreground">{it.instructions}</p>
                    )}
                  </td>
                  <td className="py-2 pr-3">{it.dosage ?? '—'}</td>
                  <td className="py-2 pr-3">{it.frequency ?? '—'}</td>
                  <td className="py-2 pr-3">{it.duration ?? '—'}</td>
                  <td className="py-2">{it.quantity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-10 flex justify-end">
            <div className="text-center text-xs text-muted-foreground">
              <div className="mb-1 h-10 w-48 border-b" />
              Prescriber signature
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
