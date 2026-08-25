'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { exportReportAction } from '@/app/(dashboard)/dashboard/reports/actions';
import type { ReportType } from '@/lib/data/reports';

interface Option {
  id: string;
  name: string;
}

export function ReportFiltersForm({
  departments,
  doctors,
  current,
}: {
  departments: Option[];
  doctors: Option[];
  current: {
    type: ReportType;
    from: string;
    to: string;
    departmentId: string;
    doctorId: string;
  };
}) {
  const router = useRouter();
  const [type, setType] = useState<ReportType>(current.type);
  const [from, setFrom] = useState(current.from);
  const [to, setTo] = useState(current.to);
  const [departmentId, setDepartmentId] = useState(current.departmentId);
  const [doctorId, setDoctorId] = useState(current.doctorId);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    p.set('type', type);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (type === 'appointments') {
      if (departmentId) p.set('departmentId', departmentId);
      if (doctorId) p.set('doctorId', doctorId);
    }
    router.push(`/dashboard/reports?${p.toString()}`);
  }

  return (
    <form onSubmit={apply} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2">
        <Label>Report</Label>
        <Select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
          <option value="registrations">Patient Registrations</option>
          <option value="appointments">Appointments</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>From</Label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>To</Label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {type === 'appointments' && (
        <>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Doctor</Label>
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">All</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr {d.name}</option>
              ))}
            </Select>
          </div>
        </>
      )}
      <div className="flex items-end">
        <Button type="submit">Apply</Button>
      </div>
    </form>
  );
}

export function ExportButton({ type }: { type: ReportType }) {
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setPending(true);
    setError(null);
    const res = await exportReportAction(type, {
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      departmentId: params.get('departmentId') ?? undefined,
      doctorId: params.get('doctorId') ?? undefined,
    });
    setPending(false);
    if (!res.ok || !res.base64) {
      setError(res.error ?? 'Export failed.');
      return;
    }
    // Convert base64 → Blob → download.
    const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename ?? 'report.xlsx';
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
