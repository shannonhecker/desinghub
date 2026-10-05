/**
 * calendarGrid - a month calendar as data, for the FX "Go to" dialog.
 *
 * Pure. Days are "YYYY-MM-DD" strings and months "YYYY-MM", in UTC (the
 * sample data's clock). Weeks start on Monday. `moveDay` is the keyboard
 * model of the WAI-ARIA date picker grid, kept inside the data's dates.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

const toMs = (day: string) => Date.parse(`${day}T00:00:00Z`);
const toDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const monthOf = (day: string): string => day.slice(0, 7);
export const monthLabel = (month: string): string => MONTH.format(toMs(`${month}-01`));

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** The month as weeks of seven (Monday first); null where no day falls. */
export function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split("-").map(Number);
  const first = Date.UTC(y, m - 1, 1);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(first).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 0; d < days; d++) cells.push(toDay(first + d * DAY_MS));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The days bars fall on. */
export function dataDays(times: readonly number[]): Set<string> {
  const out = new Set<string>();
  for (const t of times) out.add(toDay(t));
  return out;
}

/** Where a key moves the focused day, kept within [min, max]; null for any other key. */
export function moveDay(day: string, key: string, within: { min: string; max: string }): string | null {
  const ms = toMs(day);
  const weekday = (new Date(ms).getUTCDay() + 6) % 7;
  let next: string;
  switch (key) {
    case "ArrowLeft": next = toDay(ms - DAY_MS); break;
    case "ArrowRight": next = toDay(ms + DAY_MS); break;
    case "ArrowUp": next = toDay(ms - 7 * DAY_MS); break;
    case "ArrowDown": next = toDay(ms + 7 * DAY_MS); break;
    case "Home": next = toDay(ms - weekday * DAY_MS); break;
    case "End": next = toDay(ms + (6 - weekday) * DAY_MS); break;
    case "PageUp": case "PageDown": {
      const month = addMonths(monthOf(day), key === "PageUp" ? -1 : 1);
      const [y, m] = month.split("-").map(Number);
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      next = `${month}-${String(Math.min(Number(day.slice(8)), last)).padStart(2, "0")}`;
      break;
    }
    default: return null;
  }
  return next < within.min ? within.min : next > within.max ? within.max : next;
}
