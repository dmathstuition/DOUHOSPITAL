'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Stethoscope,
  Clock,
  Building2,
  UserRound,
  CircleDot,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, initials } from '@/lib/utils';

export interface DirectoryDoctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  specialization: string | null;
  department: string | null;
  on_duty: boolean;
  hours: string | null;
}

export function DoctorsDirectory({ doctors }: { doctors: DirectoryDoctor[] }) {
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const departments = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => d.department && set.add(d.department));
    return Array.from(set).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (dept !== 'all' && d.department !== dept) return false;
      if (!q) return true;
      return (
        d.full_name.toLowerCase().includes(q) ||
        (d.specialization ?? '').toLowerCase().includes(q) ||
        (d.department ?? '').toLowerCase().includes(q)
      );
    });
  }, [doctors, query, dept]);

  const onDutyCount = doctors.filter((d) => d.on_duty).length;

  return (
    <section className="relative overflow-hidden">
      {/* Soft gradient canvas + decorative blooms */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-secondary via-background to-background" />
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="container py-14 lg:py-20">
        {/* Heading */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-primary shadow-soft backdrop-blur">
            <Stethoscope className="h-3.5 w-3.5" /> Clinical Team
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Meet our <span className="text-gradient">doctors</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A dedicated team of clinicians serving the university community
            {onDutyCount > 0 && (
              <>
                {' '}— <span className="font-medium text-foreground">{onDutyCount}</span> on duty
                today.
              </>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or specialty"
              aria-label="Search doctors"
              className="rounded-full border-transparent bg-background/80 pl-9 shadow-soft backdrop-blur focus-visible:border-primary/30"
            />
          </div>

          <div className="flex items-center gap-2 self-end rounded-full border bg-background/70 p-1 shadow-soft backdrop-blur">
            <ViewToggle active={view === 'grid'} onClick={() => setView('grid')} label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ViewToggle>
            <ViewToggle active={view === 'list'} onClick={() => setView('list')} label="List view">
              <ListIcon className="h-4 w-4" />
            </ViewToggle>
          </div>
        </div>

        {/* Department tabs */}
        {departments.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <FilterTab active={dept === 'all'} onClick={() => setDept('all')}>
              All
            </FilterTab>
            {departments.map((d) => (
              <FilterTab key={d} active={dept === d} onClick={() => setDept(d)}>
                {d}
              </FilterTab>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {filtered.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title={doctors.length === 0 ? 'Doctor profiles coming soon' : 'No doctors match your search'}
              description={
                doctors.length === 0
                  ? 'The clinical team directory will appear here once the health center administration has published doctor profiles.'
                  : 'Try a different name, specialty, or department filter.'
              }
            />
          ) : view === 'grid' ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((d) => (
                <DoctorRow key={d.id} doctor={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Avatar({ doctor, size }: { doctor: DirectoryDoctor; size: number }) {
  const ring = doctor.on_duty ? 'ring-primary/40' : 'ring-border';
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gradient font-semibold text-primary-foreground ring-4',
        ring,
      )}
      style={{ height: size, width: size, fontSize: size * 0.32 }}
    >
      {doctor.photo_url ? (
        <Image
          src={doctor.photo_url}
          alt={`Dr ${doctor.full_name}`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(doctor.full_name.split(' ')[0], doctor.full_name.split(' ')[1])
      )}
    </span>
  );
}

function AvailabilityPill({ onDuty }: { onDuty: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        onDuty ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      <CircleDot className={cn('h-3 w-3', onDuty && 'animate-pulse')} />
      {onDuty ? 'Available today' : 'By appointment'}
    </span>
  );
}

function DoctorCard({ doctor }: { doctor: DirectoryDoctor }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b from-secondary to-transparent opacity-70" />
      <div className="relative flex justify-center">
        <AvailabilityPill onDuty={doctor.on_duty} />
      </div>
      <div className="relative mt-4 flex justify-center">
        <Avatar doctor={doctor} size={96} />
      </div>
      <p className="mt-4 truncate text-lg font-semibold">Dr {doctor.full_name}</p>
      {doctor.specialization && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {doctor.specialization}
        </span>
      )}
      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {doctor.department && (
          <p className="flex items-center justify-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> {doctor.department}
          </p>
        )}
        {doctor.on_duty && doctor.hours && (
          <p className="flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {doctor.hours}
          </p>
        )}
      </div>
    </div>
  );
}

function DoctorRow({ doctor }: { doctor: DirectoryDoctor }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-card">
      <Avatar doctor={doctor} size={56} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">Dr {doctor.full_name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {doctor.specialization ?? 'General Practice'}
          {doctor.department ? ` · ${doctor.department}` : ''}
        </p>
      </div>
      {doctor.on_duty && doctor.hours && (
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <Clock className="h-3.5 w-3.5" /> {doctor.hours}
        </span>
      )}
      <AvailabilityPill onDuty={doctor.on_duty} />
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-glow'
          : 'border bg-background/70 text-muted-foreground backdrop-blur hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
