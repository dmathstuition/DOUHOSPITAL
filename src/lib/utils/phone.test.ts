import { describe, it, expect } from 'vitest';
import {
  normalizeNigerianPhone,
  isValidNigerianPhone,
  formatNigerianPhone,
} from './phone';

describe('normalizeNigerianPhone', () => {
  it('normalizes local 0-prefixed numbers', () => {
    expect(normalizeNigerianPhone('08012345678')).toBe('+2348012345678');
    expect(normalizeNigerianPhone('07012345678')).toBe('+2347012345678');
    expect(normalizeNigerianPhone('08123456789')).toBe('+2348123456789');
    expect(normalizeNigerianPhone('09012345678')).toBe('+2349012345678');
  });

  it('normalizes international forms', () => {
    expect(normalizeNigerianPhone('+2348012345678')).toBe('+2348012345678');
    expect(normalizeNigerianPhone('2348012345678')).toBe('+2348012345678');
  });

  it('tolerates spaces and dashes', () => {
    expect(normalizeNigerianPhone('0801 234 5678')).toBe('+2348012345678');
    expect(normalizeNigerianPhone('0801-234-5678')).toBe('+2348012345678');
    expect(normalizeNigerianPhone(' +234 801 234 5678 ')).toBe('+2348012345678');
  });

  it('accepts a bare 10-digit national number', () => {
    expect(normalizeNigerianPhone('8012345678')).toBe('+2348012345678');
  });

  it('rejects invalid numbers', () => {
    expect(normalizeNigerianPhone('')).toBeNull();
    expect(normalizeNigerianPhone(null)).toBeNull();
    expect(normalizeNigerianPhone('123')).toBeNull();
    expect(normalizeNigerianPhone('06012345678')).toBeNull(); // starts with 6
    expect(normalizeNigerianPhone('0801234567')).toBeNull(); // too short
    expect(normalizeNigerianPhone('080123456789')).toBeNull(); // too long
    expect(normalizeNigerianPhone('+1234567890')).toBeNull(); // non-NG
  });
});

describe('isValidNigerianPhone', () => {
  it('reflects normalization success', () => {
    expect(isValidNigerianPhone('08012345678')).toBe(true);
    expect(isValidNigerianPhone('notaphone')).toBe(false);
  });
});

describe('formatNigerianPhone', () => {
  it('formats to grouped display form', () => {
    expect(formatNigerianPhone('08012345678')).toBe('+234 801 234 5678');
  });
  it('returns the trimmed input when invalid', () => {
    expect(formatNigerianPhone('abc')).toBe('abc');
  });
});
