/* ════════════════════════════════════════════════════════════
   The kit's dialog and menu, reached through RealComponentRenderer
   (types "KitDialog" and "KitMenu"), in each system's own components:
   the dialog is a named dialog with the fields, tiles and table of its
   model, its fields act, and it opts out of the builder's Escape; the
   menu lists its items as menu items and choosing one acts and closes.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RealComponentRenderer } from "../RealComponentRenderer";
import { overlayTookEscape } from "@/lib/overlayEscape";
import type { KitDialogModel, KitMenuModel } from "../RealDialogKit";

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
  root = null;
  container = null;
  document.body.innerHTML = "";
});

const SYSTEMS = ["salt", "m3", "fluent", "uoaui", "carbon"] as const;

function mount(node: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { root = createRoot(container!); root.render(node); });
}

function dialogModel(over: Partial<KitDialogModel> = {}): KitDialogModel {
  return {
    open: true, name: "probe", title: "Order ticket", description: "Sample data. Nothing is sent.",
    choice: { label: "Side", value: "BUY", onChange: vi.fn(), options: [
      { value: "SELL", name: "Sell at 1.37648", caption: "S EUR", lead: "1.37", figure: "64", tail: "8" },
      { value: "BUY", name: "Buy at 1.37656", caption: "B EUR", lead: "1.37", figure: "65", tail: "6" },
    ] },
    rows: [[
      { kind: "select", id: "probe-type", label: "Order type", value: "Limit", options: ["Limit", "Market"], onChange: vi.fn() },
      { kind: "text", id: "probe-notional", label: "Notional", value: "1,000,000", onChange: vi.fn(), error: null },
    ], [{ kind: "static", id: "probe-account", label: "Account", value: "MA-SAMPLE-01" }]],
    table: { caption: "Orders compared", columns: ["Measure", "A", "B"], rows: [{ cells: ["Fills", "12", "9"] }] },
    primary: { label: "Submit", onClick: vi.fn() },
    secondary: { label: "Cancel" },
    onClose: vi.fn(),
    ...over,
  };
}

describe("KitDialog, real", () => {
  for (const system of SYSTEMS) {
    it(`${system}: a named dialog with its tiles, fields and table, outside the builder's Escape`, () => {
      const model = dialogModel();
      mount(<RealComponentRenderer system={system} type="KitDialog" mode="light" saltDensity="medium" props={{ model }} />);
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      expect(dialog, "a dialog").not.toBeNull();
      const named = dialog!.getAttribute("aria-labelledby") ? document.getElementById(dialog!.getAttribute("aria-labelledby")!)?.textContent : dialog!.getAttribute("aria-label");
      expect(named).toContain("Order ticket");
      /* Escape is the dialog's: it closes it, and the builder is told to leave the key alone. */
      const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      act(() => { dialog!.dispatchEvent(escape); });
      expect(overlayTookEscape(escape)).toBe(true);
      expect(model.onClose).toHaveBeenCalled();
      expect(document.body.textContent).toContain("Sample data. Nothing is sent.");
      /* The tiles name their side and price. */
      const tiles = [...document.querySelectorAll(".dh-kit-tile")].map((t) => t.querySelector(".dh-kit-sr")?.textContent);
      expect(tiles).toEqual(["Sell at 1.37648", "Buy at 1.37656"]);
      /* The figures are for the eye; the sentence names the tile. */
      expect(document.querySelector(".dh-kit-tile-quote")?.getAttribute("aria-hidden")).toBe("true");
      /* The notional is a real text field, labelled, and typing reaches the model. */
      const notional = document.getElementById("probe-notional") as HTMLInputElement;
      expect(notional).not.toBeNull();
      expect(notional.readOnly).toBe(false);
      const account = document.getElementById("probe-account") as HTMLInputElement;
      expect(account.readOnly).toBe(true);
      expect(document.querySelector("table")?.textContent).toContain("Fills");
    });

    it(`${system}: closed, nothing is drawn`, () => {
      mount(<RealComponentRenderer system={system} type="KitDialog" mode="dark" saltDensity="medium" props={{ model: dialogModel({ open: false }) }} />);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
  }
});

describe("KitMenu, real", () => {
  for (const system of SYSTEMS) {
    it(`${system}: items are menu items; choosing one acts and closes`, () => {
      const anchor = document.createElement("button");
      anchor.textContent = "LMT";
      document.body.appendChild(anchor);
      const pick = vi.fn();
      const onClose = vi.fn();
      const model: KitMenuModel = { open: true, label: "Price 1.37650", anchor, onClose, items: [
        { id: "buy", label: "Buy limit at 1.37650", onSelect: pick },
        { id: "amend", label: "Amend limit price", disabled: true, onSelect: vi.fn() },
      ] };
      mount(<RealComponentRenderer system={system} type="KitMenu" mode="light" props={{ model }} />);
      const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
      expect(items.map((i) => i.textContent?.trim())).toEqual(["Buy limit at 1.37650", "Amend limit price"]);
      act(() => items[0].click());
      expect(pick).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  }
});
