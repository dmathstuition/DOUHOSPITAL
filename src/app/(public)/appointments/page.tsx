import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarPlus, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description: `Book an appointment at ${siteConfig.name}.`,
};

const steps = [
  'Choose a department',
  'Select a doctor',
  'Pick an available date',
  'Choose a time slot',
  'Describe your reason for visit',
  'Review and confirm',
];

export default function AppointmentsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Book an Appointment
        </h1>
        <p className="mt-4 text-muted-foreground">
          Appointments are booked securely through your patient portal. Sign in or register
          to choose a department, doctor and available time slot.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              <LogIn /> Sign in to book
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register">
              <UserPlus /> Register
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mx-auto mt-12 max-w-2xl">
        <CardContent className="p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarPlus className="h-5 w-5 text-primary" /> How booking works
          </h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-center gap-1 text-sm text-muted-foreground">
            You will receive an SMS and email confirmation once your appointment is booked.
            <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
