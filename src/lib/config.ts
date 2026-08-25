/**
 * Static site configuration and defaults.
 * Operational values (opening hours, contact details) are overridable at
 * runtime through the `system_settings` table / admin settings screen; the
 * values here are the seed defaults and public-marketing constants.
 */
export const siteConfig = {
  name: 'Dennis Osadebay University Health Center',
  shortName: 'DOUHC',
  tagline: 'Quality Healthcare for the Dennis Osadebay University Community',
  description:
    'The Dennis Osadebay University Health Center (DOUHC) provides accessible, professional healthcare for students, staff and the wider university community.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  logo: '/images/douhc-logo.png',
  hero: '/images/health-center-hero.jpg',
  contact: {
    address: 'Dennis Osadebay University, Asaba, Delta State, Nigeria',
    phone: '+234 800 000 0000',
    emergencyPhone: '+234 800 000 0911',
    email: 'healthcenter@dou.edu.ng',
  },
  openingHours: [
    { day: 'Monday – Friday', hours: '08:00 – 18:00' },
    { day: 'Saturday', hours: '09:00 – 14:00' },
    { day: 'Sunday', hours: 'Emergency only' },
  ],
} as const;

export type ServiceItem = {
  title: string;
  description: string;
  icon: string;
};

/** Public-facing services offered by the health center. */
export const services: ServiceItem[] = [
  {
    title: 'General Outpatient',
    description: 'Routine consultations, diagnosis and treatment for common conditions.',
    icon: 'Stethoscope',
  },
  {
    title: 'Laboratory',
    description: 'Diagnostic testing with secure digital results delivery.',
    icon: 'FlaskConical',
  },
  {
    title: 'Pharmacy',
    description: 'On-site dispensing of prescribed medications and refills.',
    icon: 'Pill',
  },
  {
    title: 'Dental',
    description: 'Oral health checks, cleaning and dental treatment.',
    icon: 'Smile',
  },
  {
    title: 'Antenatal',
    description: 'Maternal care and antenatal monitoring for expectant mothers.',
    icon: 'Baby',
  },
  {
    title: 'Health Screening',
    description: 'Preventive screening and periodic wellness checks.',
    icon: 'HeartPulse',
  },
  {
    title: 'Emergency Care',
    description: 'Prompt response to urgent and emergency medical situations.',
    icon: 'Ambulance',
  },
];

/** Public navigation for the marketing website. */
export const publicNav = [
  { title: 'Home', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Services', href: '/services' },
  { title: 'Departments', href: '/departments' },
  { title: 'Doctors', href: '/doctors' },
  { title: 'Contact', href: '/contact' },
] as const;
