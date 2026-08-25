import type { Metadata } from 'next';
import { RegistrationRequestForm } from '@/components/public/registration-request-form';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Patient Registration',
  description: `Request registration as a patient at ${siteConfig.name}.`,
};

export default function RegisterPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Patient Registration
          </h1>
          <p className="mt-3 text-muted-foreground">
            Fill in your details to request registration at {siteConfig.shortName}.
            Our staff will complete your registration — this form does not create an
            online account.
          </p>
        </div>
        <RegistrationRequestForm />
      </div>
    </div>
  );
}
