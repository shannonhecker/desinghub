/* ════════════════════════════════════════════════════════════
   Audit finding #4 (2026-05-30): zone layout edits vanished on reload.
   ════════════════════════════════════════════════════════════
   saveProject/loadProject already serialise `zoneLayouts`, but the
   autosave fingerprint (TRACKED_KEYS) did NOT include it, so a
   layout-only edit produced an identical fingerprint and never armed
   the debounce, meaning the change was never written before reload.

   TRACKED_KEYS now lives in one shared module (autoSaveTrackedKeys.ts)
   that both the cloud (useAutoSave) and local (useLocalAutoSave) writers
   import, so the two paths can never diverge on what counts as a
   meaningful edit. That module is a pure constant (no Firebase import),
   so it is safe to import directly in the jsdom CI env. We assert (a)
   zoneLayouts is tracked, (b) sessionTitle is tracked (rename arms a
   save), and (c) both writers consume the shared list. The undo/redo
   half of the same finding is covered behaviourally in
   builderHistory.test.ts.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TRACKED_KEYS } from "../autoSaveTrackedKeys";

describe("autoSave TRACKED_KEYS", () => {
  it("tracks zoneLayouts so a layout-only edit triggers an autosave", () => {
    expect(TRACKED_KEYS).toContain("zoneLayouts");
  });

  it("tracks sessionTitle so a rename triggers an autosave", () => {
    expect(TRACKED_KEYS).toContain("sessionTitle");
  });

  it("both autosave writers import the shared TRACKED_KEYS (no divergence)", () => {
    const cloud = readFileSync(
      join(process.cwd(), "src", "lib", "useAutoSave.ts"),
      "utf8"
    );
    const local = readFileSync(
      join(process.cwd(), "src", "lib", "useLocalAutoSave.ts"),
      "utf8"
    );
    expect(cloud).toMatch(/from\s+["'][^"']*autoSaveTrackedKeys["']/);
    expect(local).toMatch(/from\s+["'][^"']*autoSaveTrackedKeys["']/);
  });

  /* Multi-page Phase 2 (2026-06-07): a page-structure edit (rename / reorder /
     add / delete a page) can change `pages`/`activePageId` WITHOUT touching
     `blocks`, so both must be tracked or the change never arms the debounce —
     the same class of bug as the zoneLayouts finding above. */
  it("tracks pages so a page-structure edit triggers an autosave", () => {
    expect(src).toMatch(
      /const TRACKED_KEYS = \[[\s\S]*?"pages"[\s\S]*?\] as const/
    );
  });

  it("tracks activePageId so switching the active page triggers an autosave", () => {
    expect(src).toMatch(
      /const TRACKED_KEYS = \[[\s\S]*?"activePageId"[\s\S]*?\] as const/
    );
  });
});
