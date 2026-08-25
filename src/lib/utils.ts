import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date for display, e.g. "25 Aug 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a time value "HH:MM[:SS]" to a friendly "8:00 AM". */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const [h, m] = value.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m ?? '00'} ${suffix}`;
}

/** Compute age in whole years from a date of birth. */
export function calculateAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const birth = typeof dob === 'string' ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Produce initials from a name for avatar placeholders. */
export function initials(first?: string | null, last?: string | null): string {
  return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}` || '?';
}

/** Partially mask a phone/email recipient for display in admin lists. */
export function maskRecipient(value: string | null | undefined): string {
  if (!value) return '—';
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    const head = name.slice(0, 2);
    return `${head}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
  }
  // Phone: keep country code + last 3 digits.
  if (value.length > 6) {
    return `${value.slice(0, 4)}${'*'.repeat(value.length - 7)}${value.slice(-3)}`;
  }
  return value;
}
