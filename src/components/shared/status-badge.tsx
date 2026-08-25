import { Badge } from '@/components/ui/badge';
import type { AppointmentStatus } from '@/types/database';

const MAP: Record<
  AppointmentStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  checked_in: { label: 'Checked In', variant: 'secondary' },
  in_consultation: { label: 'In Consultation', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = MAP[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
