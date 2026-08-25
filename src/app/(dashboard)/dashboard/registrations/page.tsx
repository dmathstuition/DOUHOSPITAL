import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegistrationReview } from '@/components/admin/registration-review';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { listRegistrationRequests } from '@/lib/data/registrations';

export const metadata: Metadata = { title: 'Registration Requests' };

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'REGISTER_PATIENT')) redirect('/dashboard');

  const sp = await searchParams;
  const view = sp.view === 'all' ? undefined : ('pending' as const);
  const requests = await listRegistrationRequests(view);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registration Requests</h1>
          <p className="text-muted-foreground">
            Patients who submitted the public registration form. Approve to create
            their record, then run the normal workflow (check-in, assign a doctor).
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant={!sp.view ? 'default' : 'outline'} size="sm">
            <Link href="/dashboard/registrations">Pending</Link>
          </Button>
          <Button asChild variant={sp.view === 'all' ? 'default' : 'outline'} size="sm">
            <Link href="/dashboard/registrations?view=all">All</Link>
          </Button>
        </div>
      </div>

      <RegistrationReview requests={requests} />
    </div>
  );
}
