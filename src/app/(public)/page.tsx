import Link from 'next/link';
import {
  Stethoscope,
  Building2,
  PhoneCall,
  Clock,
  MapPin,
  Phone,
  Mail,
  Siren,
  UserRound,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { services, siteConfig } from '@/lib/config';
import { getIcon } from '@/lib/icons';
import { formatTime, initials } from '@/lib/utils';
import { getDoctorsOnDutyToday } from '@/lib/data/doctors';

const departments = [
  'General Outpatient',
  'Laboratory',
  'Pharmacy',
  'Dental',
  'Antenatal',
  'Emergency',
  'Health Screening',
];

export default async function HomePage() {
  const doctors = await getDoctorsOnDutyToday();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-secondary via-background to-background">
        {/* decorative brand glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="container relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <Badge variant="secondary" className="mb-4 shadow-soft">
              🏥 University Health Center
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Quality healthcare for the{' '}
              <span className="text-gradient">university community</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              {siteConfig.name} — {siteConfig.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/services">
                  <Stethoscope /> Our Services
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">
                  <PhoneCall /> Contact Us
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Visit the health center to register — our staff will attend to you.
            </p>
          </div>

          {/* Hero image placeholder — replace public/images/health-center-hero.jpg */}
          <div className="relative">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-primary/10 shadow-sm">
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.18),transparent_60%)] p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                  DH
                </span>
                <p className="text-sm font-medium text-muted-foreground">
                  Health Center hero image
                </p>
                <p className="text-xs text-muted-foreground">
                  /public/images/health-center-hero.jpg
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="container py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/services" icon={Stethoscope} label="Our Services" />
          <QuickAction href="/departments" icon={Building2} label="View Departments" />
          <QuickAction href="/doctors" icon={UserRound} label="Our Doctors" />
          <QuickAction href="/contact" icon={PhoneCall} label="Contact Health Center" />
        </div>
      </section>

      {/* Services */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <SectionHeading
            title="Our Services"
            subtitle="Comprehensive healthcare for the university community"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = getIcon(s.icon);
              return (
                <Card key={s.title} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctors on duty today */}
      <section className="container py-16">
        <SectionHeading
          title="Doctors on Duty Today"
          subtitle="Clinicians scheduled for consultation today"
        />
        <div className="mt-8">
          {doctors.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="No doctors are scheduled today"
              description="Duty rosters are managed by the health center administration and will appear here automatically once schedules are configured."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-primary">
                      {initials(d.full_name.split(' ')[0], d.full_name.split(' ')[1])}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">Dr {d.full_name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {d.specialization ?? 'General Practice'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.department} · {formatTime(d.start_time)}–{formatTime(d.end_time)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Departments */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container">
          <SectionHeading title="Departments" subtitle="Specialised units within DOUHC" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((name) => (
              <Card key={name} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/departments"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Opening hours + contact */}
      <section className="container grid gap-6 py-16 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Opening Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {siteConfig.openingHours.map((row) => (
              <div
                key={row.day}
                className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
              >
                <span className="font-medium">{row.day}</span>
                <span className="text-muted-foreground">{row.hours}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              {siteConfig.contact.address}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {siteConfig.contact.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {siteConfig.contact.email}
            </p>
            <p className="flex items-center gap-2 font-medium text-destructive">
              <Siren className="h-4 w-4" />
              Emergency: {siteConfig.contact.emergencyPhone}
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-medium">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
