/**
 * Date/time utilities for reminders in America/Sao_Paulo (UTC-3).
 * Brazil abolished DST in 2019, so SP is always UTC-3.
 */

const SP_TIMEZONE = 'America/Sao_Paulo';

/** Returns the current wall-clock date/time in Sao Paulo as a plain Date (values are SP local). */
function nowInSP(): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value);
  const weekday = new Date(
    new Date().toLocaleString('en-US', { timeZone: SP_TIMEZONE }),
  ).getDay();

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    weekday,
  };
}

/** Builds a UTC Date from SP local components. */
function spLocalToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  // ISO string with explicit SP offset so JS parses it correctly
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const iso = `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-03:00`;
  return new Date(iso);
}

/** Returns how many days to add to reach the target weekday (0=Sun…6=Sat). Always ≥ 1. */
function daysUntilWeekday(currentWeekday: number, target: number): number {
  const diff = (target - currentWeekday + 7) % 7;
  return diff === 0 ? 7 : diff;
}

/**
 * Tries to parse a natural-language pt-BR reminder phrase and return a UTC Date.
 * Returns null when the date/time cannot be determined reliably (caller should ask clarification).
 */
export function parsePtBrReminderDate(input: string): Date | null {
  const lower = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sp = nowInSP();

  // --- Extract time ---
  // Patterns: "às 8h", "as 8h30", "8h", "8:30", "8 horas"
  const timeRe = /(?:as?\s+)?(\d{1,2})(?::(\d{2}))?h(?:oras?)?(?!\d)|(?:as?\s+)(\d{1,2})(?::(\d{2}))?(?!\d)/;
  const timeMatch = lower.match(timeRe);

  if (!timeMatch) return null; // time is required; without it the date is ambiguous

  const hour = parseInt(timeMatch[1] ?? timeMatch[3]);
  const minute = parseInt(timeMatch[2] ?? timeMatch[4] ?? '0');

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  // --- Extract day ---
  let targetYear = sp.year;
  let targetMonth = sp.month;
  let targetDay = sp.day;

  if (/amanha/.test(lower)) {
    const d = new Date(spLocalToUtc(sp.year, sp.month, sp.day, 12, 0));
    d.setDate(d.getDate() + 1);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: SP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value);
    targetYear = get('year'); targetMonth = get('month'); targetDay = get('day');
  } else if (/\bhoje\b/.test(lower)) {
    // stays on today
  } else if (/depois de amanha|depois amanha/.test(lower)) {
    const d = new Date(spLocalToUtc(sp.year, sp.month, sp.day, 12, 0));
    d.setDate(d.getDate() + 2);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: SP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value);
    targetYear = get('year'); targetMonth = get('month'); targetDay = get('day');
  } else {
    const weekdayMap: Record<string, number> = {
      domingo: 0,
      segunda: 1,
      terca: 2,
      quarta: 3,
      quinta: 4,
      sexta: 5,
      sabado: 6,
    };
    const matchedWeekday = Object.entries(weekdayMap).find(([k]) => lower.includes(k));
    if (matchedWeekday) {
      const days = daysUntilWeekday(sp.weekday, matchedWeekday[1]);
      const d = new Date(spLocalToUtc(sp.year, sp.month, sp.day, 12, 0));
      d.setDate(d.getDate() + days);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: SP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(d);
      const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value);
      targetYear = get('year'); targetMonth = get('month'); targetDay = get('day');
    } else {
      const dayOfMonthMatch = lower.match(/\bdia\s+(\d{1,2})\b/);
      if (dayOfMonthMatch) {
        const dom = parseInt(dayOfMonthMatch[1]);
        if (dom < 1 || dom > 31) return null;
        // Use current month; if day already passed, move to next month
        const candidate = spLocalToUtc(sp.year, sp.month, dom, hour, minute);
        if (candidate > new Date()) {
          return candidate;
        }
        // Try next month
        const next = new Date(spLocalToUtc(sp.year, sp.month, 1, 12, 0));
        next.setMonth(next.getMonth() + 1);
        const nextParts = new Intl.DateTimeFormat('en-US', {
          timeZone: SP_TIMEZONE, year: 'numeric', month: '2-digit',
        }).formatToParts(next);
        const getN = (t: string) => parseInt(nextParts.find((p) => p.type === t)!.value);
        return spLocalToUtc(getN('year'), getN('month'), dom, hour, minute);
      } else {
        return null; // day is ambiguous
      }
    }
  }

  const result = spLocalToUtc(targetYear, targetMonth, targetDay, hour, minute);

  // Reject past dates
  if (result <= new Date()) return null;

  return result;
}

/** Formats a UTC Date as a human-readable SP-timezone label in pt-BR. */
export function formatSpDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: SP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Returns the current ISO datetime in SP timezone (for injecting into the Groq prompt). */
export function currentSpIsoString(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: SP_TIMEZONE }).replace(' ', 'T') + '-03:00';
}
