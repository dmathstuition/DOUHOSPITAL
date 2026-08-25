import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: `Terms governing use of the ${siteConfig.shortName} platform.`,
};

export default function TermsPage() {
  return (
    <div className="container py-16">
      <article className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
        <p className="text-muted-foreground">
          These terms govern access to and use of the {siteConfig.name} ({siteConfig.shortName})
          platform. By using this platform you agree to these terms.
        </p>

        <Section title="Eligibility & Accounts">
          Accounts are provided to members of the university community and authorised staff.
          You are responsible for keeping your credentials secure and for all activity under
          your account.
        </Section>
        <Section title="Acceptable Use">
          The platform must be used only for legitimate healthcare and administrative
          purposes. Unauthorised access, attempts to access other users&apos; records, or
          interference with platform security are prohibited.
        </Section>
        <Section title="Medical Disclaimer">
          Information provided through the platform supports, but does not replace,
          professional clinical judgement. In an emergency, call the emergency line at
          {' '}{siteConfig.contact.emergencyPhone} or seek immediate care.
        </Section>
        <Section title="Availability">
          We aim for high availability but do not guarantee uninterrupted service.
          Features may change as the platform evolves.
        </Section>
        <Section title="Contact">
          Questions about these terms can be directed to {siteConfig.contact.email}.
        </Section>
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
