import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { services, siteConfig } from '@/lib/config';
import { getIcon } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'Services',
  description: `Healthcare services offered at ${siteConfig.name}.`,
};

export default function ServicesPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Services</h1>
        <p className="mt-4 text-muted-foreground">
          A full range of clinical and preventive services for the university community.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const Icon = getIcon(s.icon);
          return (
            <Card key={s.title} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
