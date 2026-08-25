import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';
import { initials } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Doctors',
  description: `Meet the clinical team at ${siteConfig.name}.`,
};

interface PublicDoctor {
  id: string;
  full_name: string;
  specialization: string | null;
  department: string | null;
}

async function getDoctors(): Promise<PublicDoctor[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('doctors')
      .select('id, full_name, specialization, departments:department_id ( name )')
      .eq('status', 'active')
      .order('full_name');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any[]) ?? []).map((d) => ({
      id: d.id,
      full_name: d.full_name,
      specialization: d.specialization,
      department: d.departments?.name ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Doctors</h1>
        <p className="mt-4 text-muted-foreground">
          A dedicated team of clinicians serving the university community.
        </p>
      </div>

      <div className="mt-12">
        {doctors.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="Doctor profiles coming soon"
            description="The clinical team directory will appear here once the health center administration has published doctor profiles."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center gap-4 p-6">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-primary">
                    {initials(d.full_name.split(' ')[0], d.full_name.split(' ')[1])}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">Dr {d.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {d.specialization ?? 'General Practice'}
                    </p>
                    {d.department && (
                      <p className="mt-1 text-xs text-muted-foreground">{d.department}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
