import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Siren, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${siteConfig.name} — address, phone, email and emergency line.`,
};

export default function ContactPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
        <p className="mt-4 text-muted-foreground">
          We are here to help. Reach the health center through any of the channels below.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health Center Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <span>{siteConfig.contact.address}</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span>{siteConfig.contact.phone}</span>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <span>{siteConfig.contact.email}</span>
            </p>
            <p className="flex items-center gap-3 font-medium text-destructive">
              <Siren className="h-5 w-5" />
              <span>Emergency: {siteConfig.contact.emergencyPhone}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Opening Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {siteConfig.openingHours.map((row) => (
              <div
                key={row.day}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <span className="font-medium">{row.day}</span>
                <span className="text-muted-foreground">{row.hours}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Map placeholder */}
      <div className="mx-auto mt-6 max-w-4xl">
        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
          Map placeholder — {siteConfig.contact.address}
        </div>
      </div>
    </div>
  );
}
