/**
 * Appointment slot generation — pure functions (no I/O) so they are easy to
 * unit-test. The database still has the final say: a unique index prevents
 * double-booking and a trigger validates the slot against the doctor's active
 * schedule. These helpers produce the *candidate* slots the UI offers.
 */

/** Parse "HH:MM[:SS]" to minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Format minutes-since-midnight back to "HH:MM". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface SlotWindow {
  start_time: string;
  end_time: string;
  consultation_minutes: number;
}

export interface Slot {
  start: string; // HH:MM
  end: string; // HH:MM
}

/**
 * Generate contiguous slots across one or more schedule windows for a day.
 * Slots that overlap a taken start time are excluded. `takenStarts` are the
 * "HH:MM" start times already booked (cancelled/no-show excluded by the caller).
 */
export function generateSlots(
  windows: SlotWindow[],
  takenStarts: string[] = [],
): Slot[] {
  const taken = new Set(takenStarts.map((t) => t.slice(0, 5)));
  const slots: Slot[] = [];

  for (const w of windows) {
    const start = timeToMinutes(w.start_time);
    const end = timeToMinutes(w.end_time);
    const step = w.consultation_minutes > 0 ? w.consultation_minutes : 30;

    for (let t = start; t + step <= end; t += step) {
      const slotStart = minutesToTime(t);
      if (taken.has(slotStart)) continue;
      slots.push({ start: slotStart, end: minutesToTime(t + step) });
    }
  }

  // De-duplicate (overlapping windows) and sort chronologically.
  const seen = new Set<string>();
  return slots
    .filter((s) => (seen.has(s.start) ? false : (seen.add(s.start), true)))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

/** Whether a candidate start time is in the past for the given date (today only). */
export function isSlotInPast(date: string, start: string, now = new Date()): boolean {
  const todayIso = now.toISOString().slice(0, 10);
  if (date > todayIso) return false;
  if (date < todayIso) return true;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return timeToMinutes(start) <= nowMins;
}
