/**
 * Date-only helpers. Dates are handled as `YYYY-MM-DD` strings everywhere so a
 * due date never shifts when the server and browser are in different zones.
 */

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const WEEKDAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Format a Date using its *local* calendar day. */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(reference: Date = new Date()): string {
  return toISODate(reference);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/** Parse strict `YYYY-MM-DD` (or `YYYY/MM/DD`) into a local Date, else null. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value.trim());
  if (!match) return null;

  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(year, month - 1, day);

  // Reject overflow such as 2026-02-31.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Resolve a natural-language due date token (`today`, `tomorrow`, `fri`,
 * `next-week`, `2026-12-25`, `12/25`) against an anchor date.
 */
export function resolveDueToken(token: string, anchor: Date = new Date()): string | null {
  const value = token.trim().toLowerCase();
  if (!value) return null;

  if (value === "today" || value === "tod") return toISODate(anchor);
  if (value === "tomorrow" || value === "tmr" || value === "tom") {
    return toISODate(addDays(anchor, 1));
  }
  if (value === "yesterday") return toISODate(addDays(anchor, -1));
  if (value === "next-week" || value === "nextweek" || value === "+7") {
    return toISODate(addDays(anchor, 7));
  }
  if (value === "next-month" || value === "nextmonth") {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, anchor.getDate());
    return toISODate(next);
  }

  if (value in WEEKDAY_ALIASES) {
    const target = WEEKDAY_ALIASES[value];
    const delta = ((target - anchor.getDay() + 7) % 7) || 7; // never "today"
    return toISODate(addDays(anchor, delta));
  }

  if (/^\+\d{1,3}$/.test(value)) {
    return toISODate(addDays(anchor, Number(value.slice(1))));
  }

  const iso = parseISODate(value);
  if (iso) return toISODate(iso);

  // Bare `M/D` or `M-D` falls back to the anchor's year.
  const short = /^(\d{1,2})[/-](\d{1,2})$/.exec(value);
  if (short) {
    const day = Number(short[2]);
    const month = Number(short[1]);
    const candidate = new Date(anchor.getFullYear(), month - 1, day);
    if (candidate.getMonth() === month - 1 && candidate.getDate() === day) {
      return toISODate(candidate);
    }
  }

  return null;
}

/** Human label such as `Today`, `Tomorrow`, `Fri`, or `Oct 12`. */
export function formatDueDate(iso: string, today: string = todayISO()): string {
  const date = parseISODate(iso);
  if (!date) return iso;

  const delta = daysBetween(today, iso);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (delta > 1 && delta < 7) return WEEKDAYS[date.getDay()].slice(0, 3).replace(/^./, (c) => c.toUpperCase());

  const month = date.toLocaleString("en-US", { month: "short" });
  const sameYear = date.getFullYear() === (parseISODate(today)?.getFullYear() ?? date.getFullYear());
  return sameYear ? `${month} ${date.getDate()}` : `${month} ${date.getDate()}, ${date.getFullYear()}`;
}
