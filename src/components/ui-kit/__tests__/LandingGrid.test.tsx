/* /ui-kit overview: catalogue structure, search, filter and empty state.
   No RTL in the repo: react-dom/client + act(), as in FoundationPage.test. */
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { LandingGrid } from "../LandingGrid";

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
    expect(headings(el)).toEqual(expect.arrayContaining(["Foundations", "Components", "Tools"]));
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
      const stage = card.querySelector(".uikit-card-thumb");
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
    for (const card of shown) expect(card.textContent!.toLowerCase()).toContain("button");
  });

  it("section filter shows one section and reports its count", () => {
    const el = mount("salt");
    const tools = [...el.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Show"] button')].find((b) => b.textContent!.startsWith("Tools"))!;
    click(tools);
    expect(tools.getAttribute("aria-pressed")).toBe("true");
    expect(headings(el)).toEqual(["Tools"]);
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

  it("header states the mode and density the specimens render in", () => {
    const el = mount("salt");
    act(() => { useDesignHub.getState().setSaltTheme("jpm-light"); useDesignHub.getState().setSaltDensity("touch"); });
    const facts = el.querySelector("dl")!.textContent;
    expect(facts).toContain("Light");
    expect(facts).toContain("Touch");
  });
});
