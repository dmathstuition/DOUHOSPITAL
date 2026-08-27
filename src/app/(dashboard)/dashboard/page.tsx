import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Users,
  CalendarDays,
  CalendarClock,
  ListOrdered,
  Stethoscope,
  FlaskConical,
  PackageX,
  UserPlus,
  CalendarPlus,
  LogIn,
  ClipboardPlus,
  Info,
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import {
  AppointmentsByDay,
  StatusBreakdown,
  DepartmentBreakdown,
} from '@/components/dashboard/analytics-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardStats, getDashboardAnalytics } from '@/lib/data/dashboard';
import { can } from '@/lib/rbac';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const [user, stats, analytics] = await Promise.all([
    getCurrentUser(),
    getDashboardStats(),
    getDashboardAnalytics(),
  ]);
  const role = user?.role ?? 'receptionist';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-primary-foreground shadow-glow sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-primary-foreground/80">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="mt-1 text-primary-foreground/80">
            Here&apos;s an overview of the health center today.
          </p>
        </div>
      </div>

      {!stats.configured && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Backend not yet connected</p>
              <p className="text-muted-foreground">
                Supabase environment variables are not set, so live figures show as zero.
                Configure <code>.env.local</code> and run the migrations in{' '}
                <code>supabase/migrations</code> to populate the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patients Today" value={stats.patientsToday} icon={Users} />
        <StatCard label="Appointments Today" value={stats.appointmentsToday} icon={CalendarDays} />
        <StatCard label="Appointments Tomorrow" value={stats.appointmentsTomorrow} icon={CalendarClock} />
        <StatCard label="Waiting Patients" value={stats.waitingPatients} icon={ListOrdered} />
        <StatCard label="Doctors on Duty" value={stats.doctorsOnDuty} icon={Stethoscope} />
        <StatCard label="Pending Lab Results" value={analytics.pendingLabResults} icon={FlaskConical} />
        <StatCard label="Low Stock Medicines" value={analytics.lowStockMedicines} icon={PackageX} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppointmentsByDay data={analytics.byDay} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {can(role, 'REGISTER_PATIENT') && (
              <QuickLink href="/patients/new" icon={UserPlus} label="Register Patient" />
            )}
            {can(role, 'MANAGE_APPOINTMENTS') && (
              <QuickLink href="/dashboard/appointments" icon={CalendarPlus} label="Book Appointment" />
            )}
            {can(role, 'MANAGE_QUEUE') && (
              <QuickLink href="/dashboard/queue" icon={LogIn} label="Check In Patient" />
            )}
            {can(role, 'CREATE_PRESCRIPTION') && (
              <QuickLink href="/dashboard/prescriptions" icon={ClipboardPlus} label="New Prescription" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBreakdown data={analytics.byStatus} />
        <DepartmentBreakdown data={analytics.byDepartment} />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserPlus;
  label: string;
}) {
  return (
    <Button asChild variant="outline" className="justify-start">
      <Link href={href}>
        <Icon className="h-4 w-4" /> {label}
      </Link>
    </Button>
  );
}
