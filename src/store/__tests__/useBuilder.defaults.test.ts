import { describe, it, expect } from "vitest";
import { useBuilder } from "../useBuilder";

/**
 * Edit screen should open as chat + canvas, not chat + canvas + a
 * Webflow-style component palette greeting every new session expanded.
 *
 * The right-rail palette stays one click away (the "Components" pill in the
 * preview bar, plus the ⌘. shortcut), but it no longer claims ~240px of the
 * first impression. This guard pins the default so it can't silently regress
 * back to open during an unrelated store refactor.
 *
 * Vitest isolates test files, so this freshly-imported store reflects the
 * pristine initial state (nothing in this file mutates it).
 */
describe("useBuilder defaults — builder Edit screen opens uncluttered", () => {
  it("collapses the right-rail component palette by default (chat + canvas first)", () => {
    expect(useBuilder.getState().componentLibraryOpen).toBe(false);
  });
});
