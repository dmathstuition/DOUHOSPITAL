import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, HeartHandshake, GraduationCap, Target } from 'lucide-react';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${siteConfig.name} — mission, values and the care we provide.`,
};

const values = [
  { icon: HeartHandshake, title: 'Compassionate Care', text: 'We treat every member of the university community with dignity and empathy.' },
  { icon: ShieldCheck, title: 'Privacy & Safety', text: 'Health information is handled with strict confidentiality and security.' },
  { icon: GraduationCap, title: 'Student-Centred', text: 'Services are designed around the needs of students and campus life.' },
  { icon: Target, title: 'Quality First', text: 'We hold our clinical and service standards to a high, measurable bar.' },
];

export default function AboutPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          About the Health Center
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {siteConfig.name} ({siteConfig.shortName}) provides accessible, professional
          healthcare to students, staff and the wider Dennis Osadebay University community.
          Our multidisciplinary team delivers outpatient care, laboratory diagnostics,
          pharmacy services, and preventive health programmes in a modern, welcoming
          environment.
        </p>
        <p className="mt-4 text-muted-foreground">
          Our mission is to keep the university community healthy and productive by
          offering timely, coordinated and confidential care — supported by a secure
          digital platform for appointments, records and follow-up.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <Card key={v.title}>
            <CardContent className="p-6">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
