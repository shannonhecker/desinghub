/* /ui-kit overview: catalogue structure, search, filter and empty state.
   No RTL in the repo: react-dom/client + act(), as in FoundationPage.test. */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { LandingGrid, rowSpans } from "../LandingGrid";
import { getComponents } from "@/data/registry";

/* The live demos and the real cross-system renderers need a browser
   (ResizeObserver, style engines). This suite tests the catalogue around
   them; they are covered by the Playwright suite. */
vi.mock("../LiveSpecimen", () => ({ LiveSpecimen: ({ id }: { id: string }) => <div data-testid="specimen">{id}</div> }));
vi.mock("../CompareView", () => ({ ComparePanels: ({ concept }: { concept: string }) => <ul data-testid="compare">{concept}</ul> }));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
const initial = useDesignHub.getState();

function mount(system: SystemId) {
  act(() => { useDesignHub.getState().setActiveSystem(system); });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root!.render(<ThemeProvider><LandingGrid /></ThemeProvider>); });
  return host;
}
const type = (el: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => { setter.call(el, value); el.dispatchEvent(new Event("input", { bubbles: true })); });
};
const click = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const headings = (el: HTMLElement) => [...el.querySelectorAll("h2")].map((h) => h.textContent);

beforeEach(() => { act(() => { useDesignHub.setState(initial, true); }); });
afterEach(() => {
  act(() => { root?.unmount(); });
  host?.remove();
  root = null; host = null;
});

describe("LandingGrid", () => {
  const systems: SystemId[] = ["salt", "m3", "fluent", "carbon", "uoaui"];

  it.each(systems)("%s: one compact heading, then search, then separated sections", (system) => {
    const el = mount(system);
    expect(el.querySelectorAll("h1")).toHaveLength(1);
    expect(el.querySelector("#kit-search")).not.toBeNull();
    expect(headings(el).join("|")).toMatch(/Same component, five systems\|Foundations \d+\|Components \d+\|(Patterns \d+\|)?Tools 5/);
    /* Search comes before the first card in document order. */
    const search = el.querySelector("#kit-search")!;
    const firstCard = el.querySelector(".uikit-card")!;
    expect(search.compareDocumentPosition(firstCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(systems)("%s: a card has exactly one control and its specimen is inert", (system) => {
    const el = mount(system);
    const cards = [...el.querySelectorAll(".uikit-card")];
    expect(cards.length).toBeGreaterThan(10);
    for (const card of cards) {
      expect(card.tagName).not.toBe("BUTTON");
      expect(card.querySelectorAll(".uikit-card-hit")).toHaveLength(1);
      const stage = card.querySelector(".kit-stage");
      if (stage) {
        expect(stage.hasAttribute("inert")).toBe(true);
        expect(stage.getAttribute("aria-hidden")).toBe("true");
      }
      /* No interactive element inside another one. */
      expect(card.querySelector("button button, a button, button a")).toBeNull();
    }
  });

  it("each entry appears once across the sections", () => {
    const el = mount("salt");
    const names = [...el.querySelectorAll(".uikit-card-hit")].map((n) => n.textContent);
    expect(new Set(names).size).toBe(names.length);
  });

  it("opens the detail page from a card", () => {
    const el = mount("salt");
    const hit = [...el.querySelectorAll<HTMLElement>(".uikit-card-hit")].find((n) => n.textContent === "Buttons")!;
    click(hit);
    expect(useDesignHub.getState().selectedComponent).toBe("buttons");
  });

  it("links the full-page tools", () => {
    const el = mount("fluent");
    const hrefs = [...el.querySelectorAll("a.uikit-card-hit")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/token-editor", "/theme-builder"]);
  });

  it("search narrows the catalogue and shares the query with the side panel", () => {
    const el = mount("salt");
    const all = el.querySelectorAll(".uikit-card").length;
    type(el.querySelector<HTMLInputElement>("#kit-search")!, "button");
    expect(useDesignHub.getState().searchQuery).toBe("button");
    const shown = [...el.querySelectorAll(".uikit-card")];
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(all);
    /* A card shows the first sentence of its description; the match is on
       the whole registry entry (name, description, sub-category). */
    const entries = new Map(getComponents("salt").map((c) => [c.id, `${c.name} ${c.desc}`.toLowerCase()]));
    for (const card of shown) {
      const id = card.getAttribute("data-entry");
      const text = (id ? entries.get(id) ?? "" : "") + card.textContent!.toLowerCase();
      expect(text, id ?? "").toContain("button");
    }
  });

  it("section filter shows one section and reports its count", () => {
    const el = mount("salt");
    const tools = [...el.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Show"] button')].find((b) => b.textContent!.startsWith("Tools"))!;
    click(tools);
    expect(tools.getAttribute("aria-pressed")).toBe("true");
    expect(useDesignHub.getState().overviewFilter).toBe("tools");
    expect(headings(el)).toEqual(["Tools 5"]);
    expect(el.querySelectorAll(".uikit-card")).toHaveLength(5);
  });

  it("empty search explains itself and offers a way back", () => {
    const el = mount("carbon");
    type(el.querySelector<HTMLInputElement>("#kit-search")!, "zzqx-no-such-thing");
    expect(el.querySelectorAll(".uikit-card")).toHaveLength(0);
    expect(el.textContent).toContain("Nothing in Carbon DS matches");
    expect(el.querySelector("#kit-search-status")!.textContent).toBe("0 entries match");
    const clear = [...el.querySelectorAll("button")].find((b) => b.textContent === "Clear search")!;
    click(clear);
    expect(useDesignHub.getState().searchQuery).toBe("");
    expect(el.querySelectorAll(".uikit-card").length).toBeGreaterThan(10);
  });

  it("fingerprint shows the typeface and drives mode and density in place", () => {
    const el = mount("salt");
    act(() => { useDesignHub.getState().setSaltTheme("jpm-light"); });
    const fp = el.querySelector(".kit-fp")!;
    expect(fp.textContent).toContain("Open Sans");
    const press = (group: string, label: string) => click([...fp.querySelectorAll<HTMLButtonElement>(`[aria-label="${group}"] button`)].find((b) => b.textContent === label)!);
    press("Mode", "Dark");
    expect(useDesignHub.getState().salt.themeKey).toBe("jpm-dark");
    press("Density", "Touch");
    expect(useDesignHub.getState().salt.density).toBe("touch");
    expect(fp.querySelector('[aria-label="Density"] [aria-pressed="true"]')!.textContent).toBe("Touch");
  });

  it("a system switch keeps the search text and the section filter", () => {
    const el = mount("salt");
    type(el.querySelector<HTMLInputElement>("#kit-search")!, "date");
    act(() => { useDesignHub.getState().setOverviewFilter("components"); });
    act(() => { useDesignHub.getState().setActiveSystem("carbon"); });
    expect(el.querySelector<HTMLInputElement>("#kit-search")!.value).toBe("date");
    expect(useDesignHub.getState().overviewFilter).toBe("components");
    expect([...el.querySelectorAll(".uikit-card-hit")].map((n) => n.textContent)).toEqual(["Date Picker"]);
  });

  it("an empty search suggests the nearest names", () => {
    const el = mount("salt");
    type(el.querySelector<HTMLInputElement>("#kit-search")!, "buton");
    const offered = [...el.querySelectorAll(".kit-empty-actions button.is-tonal")].map((b) => b.textContent);
    expect(offered).toContain("Buttons");
  });
});

describe("rowSpans", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 20, 49])("%i tiles fill every row at 4, 3 and 2 columns", (n) => {
    for (const cols of [4, 3, 2]) {
      const spans = rowSpans(n, cols);
      expect(spans).toHaveLength(n);
      expect(spans.reduce((a, b) => a + b, 0) % cols, `${n} tiles in ${cols} columns`).toBe(0);
      expect(Math.max(...spans)).toBeLessThanOrEqual(cols);
    }
  });
});
