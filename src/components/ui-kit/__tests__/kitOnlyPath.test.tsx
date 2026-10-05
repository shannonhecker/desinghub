/* ════════════════════════════════════════════════════════════
   The library's skin is reachable only through `kit`.

   RealComponentRenderer and CarbonScopeStyles are shared with the builder,
   which holds its geometry to the pixel across systems. Everything the
   library adds (the Material theme, the Salt skin, normal instead of
   read-only controls, the Carbon font handling) must be off unless the
   caller passes `kit` or renders under <CarbonKitScope>.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

import { RealComponentRenderer } from "../RealComponentRenderer";
import { CarbonKitScope, CarbonScopeStyles, stripFontFaces } from "../CarbonScopeStyles";
import { getTheme } from "@/data/registry";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function render(ui: React.ReactElement): Promise<HTMLDivElement> {
  container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container!);
    root.render(ui);
  });
  return container;
}

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

const m3 = getTheme("m3", "light") as Record<string, unknown>;
const salt = getTheme("salt", "jpm-light") as Record<string, unknown>;

describe("builder path (no kit) keeps the controls it always rendered", () => {
  it("Salt: read-only controls, no skin wrapper", async () => {
    const input = await render(<RealComponentRenderer system="salt" type="SimulatedTextInput" mode="light" props={{ id: "a", label: "Label", placeholder: "Type" }} />);
    expect(input.querySelector(".kit-salt-skin")).toBeNull();
    expect(input.querySelector("input")?.hasAttribute("readonly")).toBe(true);
    expect(input.querySelector(".saltInput-readOnly")).not.toBeNull();
  });

  it("Salt with kit: the skin wrapper and a normal field", async () => {
    const input = await render(<RealComponentRenderer system="salt" type="SimulatedTextInput" mode="light" kit={salt} props={{ id: "a", label: "Label", placeholder: "Type" }} />);
    expect(input.querySelector(".kit-salt-skin")).not.toBeNull();
    expect(input.querySelector("input")?.hasAttribute("readonly")).toBe(false);
    expect(input.querySelector("input")?.getAttribute("placeholder")).toBe("Type");
    expect(input.querySelector(".saltInput-readOnly")).toBeNull();
  });

  it("Carbon: read-only without kit, normal with kit", async () => {
    const plain = await render(<RealComponentRenderer system="carbon" type="SimulatedSwitch" mode="light" props={{ id: "t1", label: "Toggle" }} />);
    expect(plain.querySelector(".cds--toggle--readonly")).not.toBeNull();
    afterEachUnmount();
    const kit = await render(<RealComponentRenderer system="carbon" type="SimulatedSwitch" mode="light" kit={{}} props={{ id: "t2", label: "Toggle" }} />);
    expect(kit.querySelector(".cds--toggle")).not.toBeNull();
    expect(kit.querySelector(".cds--toggle--readonly")).toBeNull();
  });

  it("Material: the tonal secondary button exists only with kit", async () => {
    const plain = await render(<RealComponentRenderer system="m3" type="SimulatedButton" mode="light" props={{ variant: "secondary", label: "Secondary" }} />);
    expect(plain.querySelector("button")?.className).toContain("MuiButton-outlined");
    afterEachUnmount();
    const kit = await render(<RealComponentRenderer system="m3" type="SimulatedButton" mode="light" kit={m3} props={{ variant: "secondary", label: "Secondary" }} />);
    expect(kit.querySelector("button")?.className).toContain("MuiButton-contained");
  });

  it("Material: chip and switch get the Material shapes only with kit", async () => {
    const css = () => Array.from(document.styleSheets).map((sh) => Array.from(sh.cssRules).map((r) => r.cssText).join("\n")).join("\n");
    await render(<RealComponentRenderer system="m3" type="SimulatedSwitch" mode="light" props={{ id: "s1", label: "Switch" }} />);
    const before = css();
    expect(before).not.toMatch(/width:\s*52px/);
    afterEachUnmount();
    const kit = await render(<RealComponentRenderer system="m3" type="SimulatedSwitch" mode="light" kit={m3} props={{ id: "s2", label: "Switch" }} />);
    const rootClass = Array.from(kit.querySelector(".MuiSwitch-root")!.classList).find((c) => c.startsWith("css-"))!;
    const rule = css().split("\n").filter((line) => line.includes(rootClass)).join("\n");
    /* The merged override: 52 by 32, not MUI's 58 by 38 (or small 40 by 24). */
    expect(rule).toMatch(/width:\s*52px/);
    expect(rule).toMatch(/height:\s*32px/);
  });
});

describe("Material button and chip overrides do not leak to the builder", () => {
  const css = () => Array.from(document.styleSheets).map((sh) => Array.from(sh.cssRules).map((r) => r.cssText).join("\n")).join("\n");
  const rulesFor = (el: Element | null) => {
    const cls = Array.from(el!.classList).filter((c) => c.startsWith("css-"));
    return css().split("\n").filter((line) => cls.some((c) => line.includes(c))).join("\n");
  };

  it("button: MUI's default shape without kit, the Material pill with it", async () => {
    const plain = await render(<RealComponentRenderer system="m3" type="SimulatedButton" mode="light" props={{ variant: "primary", label: "Go" }} />);
    const plainRule = rulesFor(plain.querySelector("button"));
    expect(plainRule).not.toMatch(/border-radius:\s*9999px/);
    expect(plainRule).toMatch(/text-transform:\s*uppercase/);
    expect(plainRule).not.toMatch(/rgb\(103, 80, 164\)|#6750a4/i);
    afterEachUnmount();
    const kit = await render(<RealComponentRenderer system="m3" type="SimulatedButton" mode="light" kit={m3} props={{ variant: "primary", label: "Go" }} />);
    const kitRule = rulesFor(kit.querySelector("button"));
    expect(kitRule).toMatch(/border-radius:\s*9999px/);
    expect(kitRule).toMatch(/text-transform:\s*none/);
  });

  it("chip: MUI's filled pill without kit, the outlined 8px chip with it", async () => {
    const plain = await render(<RealComponentRenderer system="m3" type="SimulatedPill" mode="light" props={{ label: "Tag" }} />);
    const plainRule = rulesFor(plain.querySelector(".MuiChip-root"));
    expect(plainRule).not.toMatch(/border-radius:\s*8px/);
    expect(plainRule).not.toMatch(/border:\s*1px solid/);
    afterEachUnmount();
    const kit = await render(<RealComponentRenderer system="m3" type="SimulatedPill" mode="light" kit={m3} props={{ label: "Tag" }} />);
    const kitRule = rulesFor(kit.querySelector(".MuiChip-root"));
    expect(kitRule).toMatch(/border-radius:\s*8px/);
    expect(kitRule).toMatch(/height:\s*32px/);
  });

  it("switch label: MUI's spacing without kit, a real gap with it", async () => {
    const plain = await render(<RealComponentRenderer system="m3" type="SimulatedSwitch" mode="light" props={{ id: "g1", label: "Switch" }} />);
    expect(rulesFor(plain.querySelector(".MuiFormControlLabel-root"))).not.toMatch(/gap:\s*12px/);
    afterEachUnmount();
    const kit = await render(<RealComponentRenderer system="m3" type="SimulatedSwitch" mode="light" kit={m3} props={{ id: "g2", label: "Switch" }} />);
    expect(rulesFor(kit.querySelector(".MuiFormControlLabel-root"))).toMatch(/gap:\s*12px/);
  });
});

function afterEachUnmount() {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
}

describe("CarbonScopeStyles", () => {
  beforeEach(() => {
    document.head.querySelectorAll("[data-carbon-scope],[data-carbon-scope-kit]").forEach((el) => el.remove());
    vi.resetModules();
  });

  it("builder path: a plain link to the sheet and no fetch, as on main", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const mod = await import("../CarbonScopeStyles");
    await render(<mod.CarbonScopeStyles />);
    const link = document.head.querySelector("link[data-carbon-scope]") as HTMLLinkElement | null;
    expect(link?.getAttribute("href")).toBe("/carbon-scoped.css");
    expect(link?.rel).toBe("stylesheet");
    expect(document.head.querySelector("style[data-carbon-scope-kit]")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("library path: fetched, font faces removed, no link", async () => {
    const sheet = "@font-face { font-family: 'IBM Plex Sans'; src: url(https://1.www.s81c.com/x.woff2); }\n.carbon-live-scope .cds--btn { font-family: 'IBM Plex Sans', system-ui, sans-serif; }\n.carbon-live-scope code { font-family: 'IBM Plex Mono', monospace; }";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, text: async () => sheet })));
    const mod = await import("../CarbonScopeStyles");
    await render(<mod.CarbonKitScope><mod.CarbonScopeStyles /></mod.CarbonKitScope>);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    const style = document.head.querySelector("style[data-carbon-scope-kit]");
    expect(style).not.toBeNull();
    expect(document.head.querySelector("link[data-carbon-scope]")).toBeNull();
    expect(style!.textContent).not.toContain("@font-face");
    expect(style!.textContent).not.toContain("s81c.com");
    vi.unstubAllGlobals();
  });

  it("the font rewrite falls back to exactly what Carbon wrote", () => {
    const out = stripFontFaces(".a { font-family: 'IBM Plex Sans', system-ui, sans-serif; }\n.b{font-family:'IBM Plex Mono',monospace}");
    /* Outside the library --kit-carbon-* is unset, so var() yields its
       fallback: the same family, in the same place in the same list. */
    expect(out).toContain("font-family: var(--kit-carbon-sans, 'IBM Plex Sans'), system-ui, sans-serif;");
    expect(out).toContain("font-family: var(--kit-carbon-mono, 'IBM Plex Mono'),monospace");
    expect(CarbonKitScope).toBeTypeOf("function");
    expect(CarbonScopeStyles).toBeTypeOf("function");
  });
});
