import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { BarChart3 } from 'lucide-react';
import { ReportFiltersForm, ExportButton } from '@/components/reports/report-controls';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { runReport, type ReportType } from '@/lib/data/reports';
import { listActiveDepartments, listActiveDoctors } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Reports' };

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    from?: string;
    to?: string;
    departmentId?: string;
    doctorId?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'EXPORT_REPORTS')) redirect('/dashboard');

  const sp = await searchParams;
  const type: ReportType = sp.type === 'appointments' ? 'appointments' : 'registrations';
  const from = sp.from || defaultFrom();
  const to = sp.to || new Date().toISOString().slice(0, 10);

  const [departments, doctors, report] = await Promise.all([
    listActiveDepartments(),
    listActiveDoctors(),
    runReport(type, { from, to, departmentId: sp.departmentId, doctorId: sp.doctorId }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Operational reports with filters and audited Excel export. Ordinary
          exports exclude clinical notes.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <ReportFiltersForm
            departments={departments}
            doctors={doctors.map((d) => ({ id: d.id, name: d.full_name }))}
            current={{
              type,
              from,
              to,
              departmentId: sp.departmentId ?? '',
              doctorId: sp.doctorId ?? '',
            }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {report.title} · {report.rows.length} row{report.rows.length === 1 ? '' : 's'}
        </p>
        <ExportButton type={type} />
      </div>

      {report.rows.length === 0 ? (
        <EmptyState icon={BarChart3} title="No data for the selected filters" />
      ) : (
        <Card className="overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {report.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.slice(0, 500).map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    {row.map((cell, j) => (
                      <td key={j} className="whitespace-nowrap px-3 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.rows.length > 500 && (
            <p className="border-t p-2 text-center text-xs text-muted-foreground">
              Showing first 500 rows · export to Excel for the full {report.rows.length} rows.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
