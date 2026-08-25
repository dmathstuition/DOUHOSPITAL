import Link from 'next/link';
import { MapPin, Phone, Mail, Siren } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { siteConfig } from '@/lib/config';

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link href="/departments" className="hover:text-foreground">Departments</Link></li>
            <li><Link href="/doctors" className="hover:text-foreground">Doctors</Link></li>
            <li><Link href="/appointments" className="hover:text-foreground">Book Appointment</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-foreground">Privacy Notice</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Terms of Use</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Staff Login</Link></li>
            <li><Link href="/register" className="hover:text-foreground">Patient Registration</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{siteConfig.contact.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{siteConfig.contact.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{siteConfig.contact.email}</span>
            </li>
            <li className="flex items-center gap-2 font-medium text-destructive">
              <Siren className="h-4 w-4 shrink-0" />
              <span>Emergency: {siteConfig.contact.emergencyPhone}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>DOUHC — {siteConfig.shortName}</p>
        </div>
      </div>
    </footer>
  );
}
