/**
 * Nigerian phone-number utilities.
 *
 * Supported input forms:
 *   08012345678
 *   07012345678
 *   08123456789
 *   +2348012345678
 *   2348012345678
 *   0801 234 5678   (spaces / dashes tolerated)
 *
 * Canonical internal form: +2348012345678 (E.164).
 */

const NG_COUNTRY_CODE = '234';

/** Strip everything except digits and a single leading '+'. */
function clean(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalize a Nigerian phone number to E.164 (+234XXXXXXXXXX).
 * Returns null when the value cannot be interpreted as a valid NG mobile number.
 */
export function normalizeNigerianPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const c = clean(input);
  let national: string | null = null;

  if (c.startsWith('+234')) {
    national = c.slice(4);
  } else if (c.startsWith('234')) {
    national = c.slice(3);
  } else if (c.startsWith('0')) {
    national = c.slice(1);
  } else if (c.length === 10) {
    // Bare 10-digit national number without leading zero.
    national = c;
  } else {
    return null;
  }

  // A valid NG mobile national number is 10 digits and starts with 7, 8 or 9.
  if (!/^[789]\d{9}$/.test(national)) return null;

  return `+${NG_COUNTRY_CODE}${national}`;
}

/** True when the input is a valid Nigerian mobile number. */
export function isValidNigerianPhone(input: string | null | undefined): boolean {
  return normalizeNigerianPhone(input) !== null;
}

/** Human-friendly display form, e.g. "+234 801 234 5678". */
export function formatNigerianPhone(input: string | null | undefined): string {
  const n = normalizeNigerianPhone(input);
  if (!n) return input?.trim() ?? '';
  // +234 XXX XXX XXXX
  const rest = n.slice(4);
  return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
}
