import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: `How ${siteConfig.name} handles personal and health information.`,
};

export default function PrivacyPage() {
  return (
    <div className="container py-16">
      <article className="prose-douhc mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Notice</h1>
        <p className="text-muted-foreground">
          This notice explains how {siteConfig.name} ({siteConfig.shortName}) collects,
          uses and protects personal and health information. This platform processes
          sensitive personal data and is designed with privacy and security in mind.
        </p>

        <Section title="Information We Collect">
          We collect information necessary to provide healthcare services, including
          demographic details, student information, contact details, and clinical records
          such as vital signs, consultations, laboratory results and prescriptions.
        </Section>

        <Section title="How We Use Information">
          Information is used to deliver care, manage appointments, send appointment and
          follow-up notifications, and maintain accurate medical records. Access is
          restricted on a least-privilege, need-to-know basis.
        </Section>

        <Section title="Data Security">
          We apply technical and organisational controls including role-based access
          control, row-level security, encrypted transport, private document storage,
          audit logging and controlled data export.
        </Section>

        <Section title="Your Rights">
          You may request access to the personal information we hold about you, and request
          corrections. Contact the health center administration for assistance.
        </Section>

        <Section title="Notifications">
          With your contact details we may send SMS and email notifications relating to
          your care (for example appointment confirmations and reminders). Message and
          data rates may apply.
        </Section>

        <Section title="Legal Review">
          The presence of technical controls does not by itself constitute legal
          compliance. The institution will conduct the necessary legal and privacy review
          before production deployment.
        </Section>

        <p className="text-sm text-muted-foreground">
          Contact: {siteConfig.contact.email} · {siteConfig.contact.phone}
        </p>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </section>
  );
}
