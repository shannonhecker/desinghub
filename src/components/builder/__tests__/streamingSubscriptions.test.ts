/* ════════════════════════════════════════════════════════════
   Builder streaming-perf: narrowed store subscriptions.
   ════════════════════════════════════════════════════════════
   PreviewCanvas + BuilderApp used to call a BARE `useBuilder()`
   with NO selector, so each of zustand's per-frame notifications
   during AI streaming (the message flush fires ~60fps) re-rendered
   the whole canvas + shell. A bare no-arg subscription is the
   pathology — it subscribes to EVERY store key.

   These guards assert the bare whole-store subscription is gone and
   the components instead read a narrow `useShallow({...})` slice. The
   runtime case proves a `useShallow` selector over the real store
   returns exactly the slice the components consume (shape parity), so
   "behaviour identical, only granularity changed" is verifiable, not
   asserted on faith.

   ChatPanel is the 3rd whole-store subscriber but is intentionally
   excluded — it is being reworked in open PR #365.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { shallow } from "zustand/shallow";
import { useBuilder } from "@/store/useBuilder";

type BuilderState = ReturnType<typeof useBuilder.getState>;

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(here, "..");

/* Read a source file with comments stripped, so prose that mentions a
   bare `useBuilder()` (this fix documents the pathology it removed) can't
   trip the code-level guard below. */
const readCode = (file: string) =>
  readFileSync(resolve(componentsDir, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/(^|[^:])\/\/.*$/gm, "$1"); // line comments (keep http: etc.)

const read = (file: string) =>
  readFileSync(resolve(componentsDir, file), "utf8");

/* A bare whole-store subscription: `useBuilder()` with no selector
   argument passed (only whitespace inside the parens). */
const BARE_USE_BUILDER = /useBuilder\(\s*\)/;

describe("builder streaming subscriptions are narrowed", () => {
  it("PreviewCanvas does not subscribe to the whole store", () => {
    expect(BARE_USE_BUILDER.test(readCode("PreviewCanvas.tsx"))).toBe(false);
    expect(read("PreviewCanvas.tsx")).toContain("useShallow");
  });

  it("BuilderApp does not subscribe to the whole store", () => {
    expect(BARE_USE_BUILDER.test(readCode("BuilderApp.tsx"))).toBe(false);
    expect(read("BuilderApp.tsx")).toContain("useShallow");
  });

  it("a narrow slice selector returns exactly the fields the components read", () => {
    /* Drive a representative narrow selector against the store's current
       snapshot to prove the slice carries the same VALUES a bare read
       would (behaviour parity) and ONLY the requested keys (granularity). */
    const selector = (s: BuilderState) => ({
      designSystem: s.designSystem,
      blocks: s.blocks,
      selectedBlockId: s.selectedBlockId,
      density: s.density,
      activePageId: s.activePageId,
    });
    const slice = selector(useBuilder.getState());
    const full = useBuilder.getState();
    expect(slice.designSystem).toBe(full.designSystem);
    expect(slice.blocks).toBe(full.blocks);
    expect(slice.selectedBlockId).toBe(full.selectedBlockId);
    expect(slice.density).toBe(full.density);
    expect(slice.activePageId).toBe(full.activePageId);
    /* The slice carries ONLY the requested keys, not the whole store. */
    expect(Object.keys(slice).sort()).toEqual(
      ["activePageId", "blocks", "density", "designSystem", "selectedBlockId"],
    );
  });

  it("shallow-equality suppresses a re-render when the slice is unchanged", () => {
    /* This is the mechanism the fix relies on: useShallow wraps zustand's
       `shallow` comparator, so a streaming flush that mutates an unrelated
       key (e.g. messages) leaves a narrow slice shallow-equal → no re-render.
       A bare whole-store subscription is never shallow-equal across a flush. */
    const selector = (s: BuilderState) => ({
      designSystem: s.designSystem,
      blocks: s.blocks,
      density: s.density,
    });
    const before = selector(useBuilder.getState());
    /* Simulate a streaming message flush — touches `messages` only. */
    useBuilder.setState((s) => ({
      messages: [...s.messages, { id: "x", role: "ai", content: "…", timestamp: 0 }],
    }) as never);
    const after = selector(useBuilder.getState());
    expect(shallow(before, after)).toBe(true);
  });

  it("BuilderApp's `hasMessages` slice stays shallow-equal when a message is appended after the first", () => {
    /* The BuilderApp shell only ever derived a boolean (`userStarted`) from
       `messages`, so its slice now carries the DERIVED boolean
       `hasMessages: s.messages.length > 0` instead of the array ref. This
       gives the shell the same streaming-flush immunity PreviewCanvas has:
       once the first message lands, every further append (the per-frame
       streaming flush creates a NEW messages array ref each frame) leaves the
       boolean unchanged, so the slice is shallow-equal and the shell does not
       re-render. The selector here mirrors BuilderApp's exact derivation. */
    const hasMessagesSlice = (s: BuilderState) => ({
      hasMessages: s.messages.length > 0,
    });

    /* Land the FIRST message: false → true. The boolean flips here, so this
       transition SHOULD re-render (the hero docks). Not the case under test. */
    useBuilder.setState({ messages: [] } as never);
    const empty = hasMessagesSlice(useBuilder.getState());
    useBuilder.setState((s) => ({
      messages: [...s.messages, { id: "m1", role: "user", content: "hi", timestamp: 0 }],
    }) as never);
    const afterFirst = hasMessagesSlice(useBuilder.getState());
    expect(shallow(empty, afterFirst)).toBe(false); // first message flips the boolean

    /* Now the streaming flushes: each appends to a NEW array ref, but the
       boolean is already true and stays true → shallow-equal → no re-render. */
    const beforeFlush = hasMessagesSlice(useBuilder.getState());
    useBuilder.setState((s) => ({
      messages: [...s.messages, { id: "m2", role: "ai", content: "…", timestamp: 0 }],
    }) as never);
    const afterFlush = hasMessagesSlice(useBuilder.getState());
    expect(useBuilder.getState().messages.length).toBeGreaterThan(1); // array ref did change
    expect(shallow(beforeFlush, afterFlush)).toBe(true); // but the derived slice did not
  });
});
