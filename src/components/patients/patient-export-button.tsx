'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportPatientsAction } from '@/app/(dashboard)/patients/actions';

export function PatientExportButton() {
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setPending(true);
    setError(null);
    const res = await exportPatientsAction(params.get('q') ?? undefined);
    setPending(false);
    if (!res.ok || !res.base64) {
      setError(res.error ?? 'Export failed.');
      return;
    }
    const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename ?? 'patients.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={download} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Download />} Export to Excel
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
