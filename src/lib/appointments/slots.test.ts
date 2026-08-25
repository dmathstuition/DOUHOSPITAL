import { describe, it, expect } from 'vitest';
import {
  generateSlots,
  timeToMinutes,
  minutesToTime,
  isSlotInPast,
} from './slots';

describe('time helpers', () => {
  it('converts between time and minutes', () => {
    expect(timeToMinutes('08:00')).toBe(480);
    expect(timeToMinutes('16:30:00')).toBe(990);
    expect(minutesToTime(480)).toBe('08:00');
    expect(minutesToTime(990)).toBe('16:30');
  });
});

describe('generateSlots', () => {
  it('generates 30-minute slots across a window', () => {
    const slots = generateSlots([
      { start_time: '08:00', end_time: '10:00', consultation_minutes: 30 },
    ]);
    expect(slots.map((s) => s.start)).toEqual(['08:00', '08:30', '09:00', '09:30']);
    expect(slots[0].end).toBe('08:30');
  });

  it('excludes taken start times (prevents double-booking at the UI layer)', () => {
    const slots = generateSlots(
      [{ start_time: '08:00', end_time: '10:00', consultation_minutes: 30 }],
      ['08:30', '09:00:00'],
    );
    expect(slots.map((s) => s.start)).toEqual(['08:00', '09:30']);
  });

  it('does not produce a slot that overflows the window', () => {
    const slots = generateSlots([
      { start_time: '08:00', end_time: '08:45', consultation_minutes: 30 },
    ]);
    // Only 08:00–08:30 fits; 08:30–09:00 would overflow 08:45.
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: '08:00', end: '08:30' });
  });

  it('merges multiple windows and de-duplicates overlaps', () => {
    const slots = generateSlots([
      { start_time: '08:00', end_time: '09:00', consultation_minutes: 30 },
      { start_time: '08:30', end_time: '09:30', consultation_minutes: 30 },
    ]);
    expect(slots.map((s) => s.start)).toEqual(['08:00', '08:30', '09:00']);
  });

  it('supports custom slot lengths', () => {
    const slots = generateSlots([
      { start_time: '08:00', end_time: '09:00', consultation_minutes: 20 },
    ]);
    expect(slots.map((s) => s.start)).toEqual(['08:00', '08:20', '08:40']);
  });
});

describe('isSlotInPast', () => {
  const now = new Date('2026-08-25T10:15:00');
  it('future dates are never past', () => {
    expect(isSlotInPast('2026-08-26', '08:00', now)).toBe(false);
  });
  it('earlier dates are always past', () => {
    expect(isSlotInPast('2026-08-24', '23:00', now)).toBe(true);
  });
  it('today compares the time', () => {
    expect(isSlotInPast('2026-08-25', '09:00', now)).toBe(true);
    expect(isSlotInPast('2026-08-25', '11:00', now)).toBe(false);
  });
});
