/* ════════════════════════════════════════════════════════════
   A small form in the design system's own dialog (FX "Go to"): in every
   system it is a named dialog with labelled fields, a choice and two
   actions; Escape closes it and nothing else; focus goes back to the
   launcher; an error is announced by its field.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RealComponentRenderer } from "../RealComponentRenderer";
import type { FormDialogModel } from "../RealFormDialog";

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  }
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  }
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
});

const SYSTEMS = ["salt", "m3", "fluent", "uoaui", "carbon"] as const;

function Harness({ system, onClose, onSubmit, error, onPick }: { system: (typeof SYSTEMS)[number]; onClose: () => void; onSubmit: () => void; error?: string; onPick?: (day: string) => void }) {
  const launcher = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  /* Opened from its launcher, as in the chart. */
  React.useEffect(() => { launcher.current?.focus(); setOpen(true); }, []);
  const [date, setDate] = React.useState("2026-01-05");
  const [choice, setChoice] = React.useState("Date");
  const [month, setMonth] = React.useState("2026-01");
  const model: FormDialogModel = {
    open, title: "Go to", note: "Data from 5 Oct 2025 to 5 Jan 2026.",
    choice: { label: "Go to a", options: ["Date", "Custom range"], value: choice, onChange: setChoice },
    calendar: {
      label: "Pick a day", month, onMonth: setMonth, selected: [date], min: "2025-10-05", max: "2026-01-05",
      /* Weekdays have bars; weekends do not. */
      enabled: (d) => { const w = new Date(`${d}T00:00:00Z`).getUTCDay(); return w !== 0 && w !== 6; },
      onPick: (d) => { setDate(d); onPick?.(d); },
    },
    rows: [[
      { id: `goto-date-${system}`, label: "Date", type: "date", value: date, onChange: setDate, min: "2025-10-05", max: "2026-01-05", error: error ?? null },
      { id: `goto-time-${system}`, label: "Time", type: "time", value: "10:30", onChange: () => {} },
    ]],
    primary: { label: "Go to", onClick: onSubmit },
    cancel: { label: "Cancel" },
    onClose: () => { onClose(); setOpen(false); },
    returnFocus: launcher,
  };
  return (
    <>
      <button ref={launcher} type="button">Open Go to</button>
      <RealComponentRenderer system={system} type="FormDialog" mode="light" saltDensity="high" props={{ model }} />
    </>
  );
}

/** An input's accessible name: aria-labelledby, a label for it, or aria-label. */
function nameOf(input: HTMLElement): string {
  const by = input.getAttribute("aria-labelledby");
  if (by) return by.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
  return document.querySelector(`label[for="${input.id}"]`)?.textContent ?? input.getAttribute("aria-label") ?? "";
}

function mount(node: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { root = createRoot(container!); root.render(node); });
}

describe("FormDialog, real, in every system", () => {
  for (const system of SYSTEMS) {
    it(`${system}: a named dialog with labelled date fields and both actions`, async () => {
      mount(<Harness system={system} onClose={() => {}} onSubmit={() => {}} />);
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      expect(dialog).not.toBeNull();
      const named = dialog!.getAttribute("aria-labelledby");
      const name = named ? document.getElementById(named.split(" ")[0])?.textContent : dialog!.getAttribute("aria-label");
      expect(name).toContain("Go to");
      const date = document.getElementById(`goto-date-${system}`) as HTMLInputElement;
      expect(date.type).toBe("date");
      expect(date.min).toBe("2025-10-05");
      expect(date.max).toBe("2026-01-05");
      expect(nameOf(date)).toContain("Date");
      const buttons = [...document.querySelectorAll("button")].map((b) => b.textContent?.trim());
      expect(buttons).toContain("Cancel");
      expect(buttons).toContain("Go to");
      expect(buttons.some((b) => b?.startsWith("Custom range"))).toBe(true);
    });

    it(`${system}: Escape closes it and nothing else; focus returns to the launcher`, async () => {
      const onClose = vi.fn();
      const outside = vi.fn();
      window.addEventListener("keydown", outside);
      mount(<Harness system={system} onClose={onClose} onSubmit={() => {}} />);
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const date = document.getElementById(`goto-date-${system}`) as HTMLInputElement;
      act(() => { date.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(outside).not.toHaveBeenCalled();
      window.removeEventListener("keydown", outside);
      await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
      expect(document.activeElement?.textContent).toBe("Open Go to");
    });

    it(`${system}: an error is shown under its field and tied to it`, async () => {
      mount(<Harness system={system} onClose={() => {}} onSubmit={() => {}} error="Pick a date from 5 Oct 2025 to 5 Jan 2026." />);
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const date = document.getElementById(`goto-date-${system}`) as HTMLInputElement;
      expect(document.body.textContent).toContain("Pick a date from 5 Oct 2025 to 5 Jan 2026.");
      const described = `${date.getAttribute("aria-describedby") ?? ""} ${date.getAttribute("aria-errormessage") ?? ""}`.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
      expect(described, date.outerHTML).toContain("Pick a date");
    });
  }

  for (const system of SYSTEMS) {
    it(`${system}: the calendar is a keyboard grid; days without data cannot be picked`, async () => {
      const onPick = vi.fn();
      mount(<Harness system={system} onClose={() => {}} onSubmit={() => {}} onPick={onPick} />);
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
      const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
      expect(grid).not.toBeNull();
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)?.textContent).toBe("January 2026");
      const day = (d: string) => grid.ownerDocument.querySelector<HTMLButtonElement>(`[data-day="${d}"]`)!;
      /* The picked day is the one in the tab order. */
      expect(day("2026-01-05").tabIndex).toBe(0);
      expect(day("2026-01-02").tabIndex).toBe(-1);
      /* Saturday 3 January has no data. */
      expect(day("2026-01-03").getAttribute("aria-disabled")).toBe("true");
      act(() => { day("2026-01-03").click(); });
      expect(onPick).not.toHaveBeenCalled();
      day("2026-01-05").focus();
      act(() => { day("2026-01-05").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })); });
      expect(document.activeElement).toBe(day("2026-01-04"));
      act(() => { day("2026-01-04").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })); });
      act(() => { day("2026-01-03").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })); });
      act(() => { day("2026-01-02").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
      expect(onPick).toHaveBeenCalledWith("2026-01-02");
      /* Page Up: the month before, focus on the same date. */
      act(() => { day("2026-01-02").dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp", bubbles: true })); });
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)?.textContent).toBe("December 2025");
      expect(document.activeElement?.getAttribute("data-day")).toBe("2025-12-02");
    });
  }
});
