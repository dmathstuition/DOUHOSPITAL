import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultDepartments } from '@/lib/data/defaults';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/public-config';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Departments',
  description: `Clinical departments at ${siteConfig.name}.`,
};

async function getDepartments() {
  if (!isSupabaseConfigured()) return defaultDepartments.map((d) => ({ ...d }));
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('departments')
      .select('name, description, location')
      .eq('status', 'active')
      .order('name');
    if (data && data.length > 0) return data;
  } catch {
    // fall through to defaults
  }
  return defaultDepartments.map((d) => ({ ...d }));
}

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Departments</h1>
        <p className="mt-4 text-muted-foreground">
          Specialised units delivering coordinated care across the health center.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.name} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{d.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{d.description}</p>
              {d.location && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {d.location}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
