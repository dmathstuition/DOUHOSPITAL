import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientSearch } from '@/components/patients/patient-search';
import { searchPatients } from '@/lib/data/patients';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { initials } from '@/lib/utils';
import { formatNigerianPhone } from '@/lib/utils/phone';

export const metadata: Metadata = { title: 'Patients' };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const [user, result] = await Promise.all([
    getCurrentUser(),
    searchPatients({ query: sp.q, page }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.count / result.pageSize));
  const canRegister = can(user?.role, 'REGISTER_PATIENT');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            {result.count} record{result.count === 1 ? '' : 's'}
          </p>
        </div>
        {canRegister && (
          <Button asChild>
            <Link href="/patients/new">
              <UserPlus /> Register Patient
            </Link>
          </Button>
        )}
      </div>

      <PatientSearch />

      {result.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description={
            sp.q
              ? `No patients match “${sp.q}”. Try a different search.`
              : 'Register your first patient to get started.'
          }
          action={
            canRegister ? (
              <Button asChild size="sm">
                <Link href="/patients/new">
                  <UserPlus /> Register Patient
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Patient ID</th>
                    <th className="px-4 py-3 font-medium">Matric</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/patients/${p.id}`} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                            {initials(p.first_name, p.last_name)}
                          </span>
                          <span className="font-medium hover:underline">
                            {p.last_name}, {p.first_name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.patient_code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.matric_number ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.phone ? formatNigerianPhone(p.phone) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.department ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {result.rows.map((p) => (
              <Link key={p.id} href={`/patients/${p.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                      {initials(p.first_name, p.last_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {p.last_name}, {p.first_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.patient_code} · {p.matric_number ?? 'No matric'}
                      </p>
                    </div>
                    <Badge variant={p.status === 'active' ? 'success' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {result.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <PagerLink
                disabled={page <= 1}
                href={buildHref(sp.q, page - 1)}
                label="Previous"
                dir="prev"
              />
              <PagerLink
                disabled={page >= totalPages}
                href={buildHref(sp.q, page + 1)}
                label="Next"
                dir="next"
              />
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Registration dates and demographics are shown; clinical details are on
        each patient&apos;s profile, access-controlled by role.
      </p>
    </div>
  );
}

function buildHref(q: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/patients${qs ? `?${qs}` : ''}`;
}

function PagerLink({
  disabled,
  href,
  label,
  dir,
}: {
  disabled: boolean;
  href: string;
  label: string;
  dir: 'prev' | 'next';
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        {dir === 'prev' && <ChevronLeft />} {label} {dir === 'next' && <ChevronRight />}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>
        {dir === 'prev' && <ChevronLeft />} {label} {dir === 'next' && <ChevronRight />}
      </Link>
    </Button>
  );
}
