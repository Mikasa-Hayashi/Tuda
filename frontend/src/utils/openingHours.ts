/**
 * openingHours.ts
 * Parses the structured `opening_schedule` translation value and computes "open now".
 *
 * Format (JSON string): {"always": true}
 *   or {"week": {"<dayIndex 0=Sun..6=Sat>": [["10:00", "18:00"], ...]}}
 * A day missing from `week` means closed that day. Times are the device's local time.
 */

export type OpeningSchedule = { always: true } | { week: Record<string, [string, string][]> };

export type OpeningStatus =
  | { kind: 'always' }
  | { kind: 'open'; closesAt: string }
  | { kind: 'closed'; opensAt: string; opensDay: number | null };

export function parseSchedule(raw: string | null | undefined): OpeningSchedule | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OpeningSchedule;
    if (parsed && typeof parsed === 'object') {
      if ('always' in parsed && parsed.always) return parsed;
      if ('week' in parsed && parsed.week && typeof parsed.week === 'object') return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getOpeningStatus(schedule: OpeningSchedule, now: Date = new Date()): OpeningStatus {
  if ('always' in schedule) return { kind: 'always' };

  const today = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const todays = schedule.week[String(today)] ?? [];
  for (const [open, close] of todays) {
    if (minutesNow >= toMinutes(open) && minutesNow < toMinutes(close)) {
      return { kind: 'open', closesAt: close };
    }
  }

  // Next opening: later today, then the following days.
  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7;
    const intervals = [...(schedule.week[String(day)] ?? [])].sort(
      (a, b) => toMinutes(a[0]) - toMinutes(b[0]),
    );
    for (const [open] of intervals) {
      if (offset > 0 || toMinutes(open) > minutesNow) {
        return { kind: 'closed', opensAt: open, opensDay: offset === 0 ? null : day };
      }
    }
  }
  return { kind: 'closed', opensAt: '', opensDay: null };
}
