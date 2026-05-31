/* ════════════════════════════════════════════════════════════
   Audit finding #4 (2026-05-30): zone layout edits vanished on reload.
   ════════════════════════════════════════════════════════════
   saveProject/loadProject already serialise `zoneLayouts`, but the
   autosave fingerprint (TRACKED_KEYS) did NOT include it — so a
   layout-only edit produced an identical fingerprint and never armed
   the debounce, meaning the change was never written before reload.

   Source-pin (not a behavioural test) deliberately: importing the hook
   module pulls in the Firebase client at eval time, which the jsdom CI
   env can't initialise cleanly. The fix is a single entry in a literal
   array; pinning its presence in source is the proportionate guard. The
   undo/redo half of the same finding is covered behaviourally in
   builderHistory.test.ts.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(process.cwd(), "src", "lib", "useAutoSave.ts"),
  "utf8"
);

describe("useAutoSave TRACKED_KEYS", () => {
  it("tracks zoneLayouts so a layout-only edit triggers an autosave", () => {
    // The TRACKED_KEYS literal array must list "zoneLayouts".
    expect(src).toMatch(
      /const TRACKED_KEYS = \[[\s\S]*?"zoneLayouts"[\s\S]*?\] as const/
    );
  });
});
