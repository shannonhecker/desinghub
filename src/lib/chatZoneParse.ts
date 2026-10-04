/* ── Zone-phrase parser for local chat commands ──
   Extracted from ChatPanel so the parsing is pure and unit-testable.
   Detects an explicit zone target ("add a search box to the header",
   "remove the buttons from the sidebar") and returns the ZoneId, or
   null when the message names no zone. A preposition is required so a
   bare mention ("add a header") is NOT read as a zone target.
   "from" marks a SOURCE, never an add destination, so any other
   preposition outranks it ("add the inputs from the sidebar into the
   body" targets the body); a lone "from" pair still resolves for
   removal phrasing. Ties within a rank go to the last match. */

import type { ZoneId } from "@/store/useBuilder";

const ZONE_PHRASE = /\b(in|into|to|on|onto|at|from)\s+(?:the\s+)?(header|sidebar|footer|body)\b/gi;

export function parseZoneTarget(input: string): ZoneId | null {
  let destination: ZoneId | null = null;
  let source: ZoneId | null = null;
  for (const m of input.matchAll(ZONE_PHRASE)) {
    const zone = m[2].toLowerCase() as ZoneId;
    if (m[1].toLowerCase() === "from") source = zone;
    else destination = zone;
  }
  return destination ?? source;
}
