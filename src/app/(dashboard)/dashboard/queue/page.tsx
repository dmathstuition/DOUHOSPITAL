import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Users, Clock, CheckCircle2, ArrowRightCircle, Hourglass } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { QueueBoard } from '@/components/queue/queue-board';
import { getCurrentUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getTodayQueue, computeQueueStats } from '@/lib/data/queue';
import { listActiveDoctors } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Waiting Queue' };

export default async function QueuePage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_QUEUE')) redirect('/dashboard');

  const [entries, doctors] = await Promise.all([getTodayQueue(), listActiveDoctors()]);
  const stats = computeQueueStats(entries);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Waiting Queue</h1>
        <p className="text-muted-foreground">Live patient flow for today</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Waiting" value={stats.waiting} icon={Hourglass} />
        <StatCard label="In Progress" value={stats.inProgress} icon={ArrowRightCircle} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
        <StatCard
          label="Now Serving"
          value={stats.current ? stats.current.queue_number.replace('DOUHC-', '#') : '—'}
          icon={Users}
          hint={stats.current?.patient_name}
        />
        <StatCard
          label="Avg Wait"
          value={stats.avgWaitMinutes !== null ? `${stats.avgWaitMinutes}m` : '—'}
          icon={Clock}
        />
      </div>

      <QueueBoard entries={entries} doctors={doctors} />
    </div>
  );
}
