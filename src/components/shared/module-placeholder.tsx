import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';

/**
 * Honest placeholder for modules whose backend (schema, RLS, notification
 * engine) is complete but whose full UI is scheduled for a later build phase.
 * It does not fake data or actions.
 */
export function ModulePlaceholder({
  title,
  phase,
  description,
  planned,
}: {
  title: string;
  phase: string;
  description: string;
  planned: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Badge variant="warning">{phase}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Wrench className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">This module is being set up</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium">Planned in this module</p>
            <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {planned.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        The database schema, row-level security and notification engine that back
        this module are already in place — see the migrations in{' '}
        <code>supabase/migrations</code>.
      </p>
    </div>
  );
}
