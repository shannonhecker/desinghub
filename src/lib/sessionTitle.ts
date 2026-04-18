/**
 * Helpers for deriving a human-friendly session title from user input.
 *
 * Rules:
 *  - Strip leading conversational filler ("build me a ...", "create a ...")
 *    so the title reads as a noun phrase rather than an instruction.
 *  - Trim + collapse whitespace.
 *  - Capitalize the first letter.
 *  - Cap at 48 characters (with ellipsis) so sessions-drawer list rows
 *    stay single-line.
 */

const LEADING_FILLER = [
  /^build me an?\s+/i,
  /^build an?\s+/i,
  /^create an?\s+/i,
  /^make an?\s+/i,
  /^design an?\s+/i,
  /^i (?:want|need) an?\s+/i,
  /^give me an?\s+/i,
  /^let's (?:build|create|make) an?\s+/i,
  /^help me (?:build|create|make) an?\s+/i,
  /^show me an?\s+/i,
  /^can you (?:build|create|make) an?\s+/i,
];

const MAX_TITLE_LENGTH = 48;

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

/** Convert a raw first-message string into a session title. */
export function titleFromMessage(raw: string): string {
  let title = raw.trim().replace(/\s+/g, " ");
  for (const pattern of LEADING_FILLER) {
    const after = title.replace(pattern, "");
    if (after !== title) {
      title = after;
      break;
    }
  }
  /* Strip trailing punctuation that makes titles read weirdly in a
   *  list ("Dashboard?" → "Dashboard"). */
  title = title.replace(/[.!?,;:]+$/, "");

  title = capitalize(title);
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd() + "…";
  }
  return title || "Untitled session";
}

/** Title when a user picks a template. Just use the template label. */
export function titleFromTemplate(label: string): string {
  const trimmed = label.trim();
  return trimmed.length > MAX_TITLE_LENGTH
    ? trimmed.slice(0, MAX_TITLE_LENGTH - 1).trimEnd() + "…"
    : trimmed;
}

/** Format a timestamp as a relative "X ago" string. Returns a
 *  reasonable English approximation without pulling in a date lib.
 *  Updates are expected on a ~15s cadence for short intervals, or
 *  once on minute boundaries otherwise. */
export function relativeTimeLabel(ms: number | null, now = Date.now()): string {
  if (ms === null) return "";
  const diff = now - ms;
  if (diff < 5_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) {
    const m = Math.floor(diff / 60_000);
    return `${m} min${m === 1 ? "" : "s"} ago`;
  }
  if (diff < 86_400_000) {
    const h = Math.floor(diff / 3_600_000);
    return `${h} hr${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(diff / 86_400_000);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
