/* ════════════════════════════════════════════════════════════
   FoundationPage routing — /ui-kit Foundations get a doc-style
   template instead of the component-detail shell.
   ════════════════════════════════════════════════════════════
   Foundations are discriminated by CATEGORY (getUiKitGroup), not id:
   Salt/Carbon/uoaui/fluent use dl-* ids while M3 uses guide-* / a11y /
   shape-tokens style ids. MainContent must route every cat:"Foundations"
   entry to FoundationPage (eyebrow + title + DS context + the entry's
   own rendered content; NO tabs / variants matrix / props table), while
   component ids keep the DetailLayout+ComponentPreview path and the
   Tools ids (tokens / audit) keep their COMPONENT_ROUTES renderers.

   No RTL in the repo — uses react-dom/client + act() directly, matching
   AnatomyDiagram.test.tsx / VariantExample.test.tsx. Heavy siblings
   (ComponentPreview, TokenReference, AuditPanel) are mocked so the
   suite tests ROUTING + the FoundationPage template, not their guts.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getTheme } from "@/data/registry";
import { MainContent } from "../MainContent";
import { contrastRatio } from "@/lib/contrastUtils";

/* Heavy detail/tool surfaces → cheap markers. FoundationPage itself is
   NOT mocked — its rendered output is the thing under test. */
vi.mock("@/components/ComponentPreview", () => ({
  ComponentPreview: ({ componentId }: { componentId: string }) => (
    <div data-testid="mock-component-preview">{componentId}</div>
  ),
  getDetailSections: () => [],
}));
vi.mock("@/components/TokenReference", () => ({
  TokenReference: () => <div data-testid="mock-token-reference" />,
}));
vi.mock("@/components/AuditPanel", () => ({
  AuditPanel: () => <div data-testid="mock-audit-panel" />,
}));
/* useActiveTheme is a thin re-export of useTheme; mocking it here keeps
   the whole DesignHubApp import graph (ComponentList, ContentTopBar, …)
   out of the test. */
vi.mock("@/components/DesignHubApp", async () => {
  const { useTheme } = await import("@/contexts/ThemeContext");
  return { useActiveTheme: useTheme };
});

let root: Root | null = null;
afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  document.body.innerHTML = "";
});

function renderMain(
  activeSystem: SystemId,
  selectedComponent: string,
  extraState: Record<string, unknown> = {},
): HTMLElement {
  act(() => {
    useDesignHub.setState({ activeSystem, selectedComponent, ...extraState });
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(
      <ThemeProvider>
        <MainContent />
      </ThemeProvider>,
    );
  });
  return container;
}

describe("FoundationPage routing in MainContent", () => {
  it("renders a cat:'Foundations' entry (salt dl-color) via the doc template", () => {
    const c = renderMain("salt", "dl-color");
    /* Eyebrow + title + quiet DS context. */
    expect(c.querySelector(".dh-foundation-eyebrow")?.textContent).toBe("Foundations");
    expect(c.querySelector(".dh-detail-title")?.textContent).toBe("Color");
    expect(c.textContent).toContain("Salt DS");
    /* No component-detail shell: no tab bar, no variants matrix, no
       props table, no TOC rail — and not the ComponentPreview path. */
    expect(c.querySelector('[role="tablist"]')).toBeNull();
    expect(c.querySelector("#dh-sec-variants")).toBeNull();
    expect(c.querySelector(".dh-props")).toBeNull();
    expect(c.querySelector(".dh-detail-rail")).toBeNull();
    expect(c.querySelector('[data-testid="mock-component-preview"]')).toBeNull();
  });

  it("routes M3 guide-* foundation ids (guide-color-roles) to the doc template too", () => {
    const c = renderMain("m3", "guide-color-roles");
    expect(c.querySelector(".dh-foundation-eyebrow")?.textContent).toBe("Foundations");
    expect(c.querySelector(".dh-detail-title")?.textContent).toBe("Color Roles");
    expect(c.textContent).toContain("Material 3");
    expect(c.querySelector('[role="tablist"]')).toBeNull();
    expect(c.querySelector('[data-testid="mock-component-preview"]')).toBeNull();
  });

  it("keeps component ids (salt buttons) on the ComponentPreview path", () => {
    const c = renderMain("salt", "buttons");
    expect(c.querySelector('[data-testid="mock-component-preview"]')?.textContent).toBe("buttons");
    expect(c.querySelector(".dh-foundation-eyebrow")).toBeNull();
  });

  it("keeps the tokens Tools id on the TokenReference route", () => {
    const c = renderMain("salt", "tokens");
    expect(c.querySelector('[data-testid="mock-token-reference"]')).not.toBeNull();
    expect(c.querySelector(".dh-foundation-eyebrow")).toBeNull();
  });

  it("keeps the audit Tools id on the AuditPanel route", () => {
    const c = renderMain("salt", "audit");
    expect(c.querySelector('[data-testid="mock-audit-panel"]')).not.toBeNull();
    expect(c.querySelector(".dh-foundation-eyebrow")).toBeNull();
  });
});

/* Flush the CodePanel snippet-module dynamic import + the state update it
   schedules. A couple of macrotask turns inside act() is enough for the
   import → cache → setState chain to settle. */
async function flushAsync() {
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

describe("FoundationPage content parity with the old ComponentPreview path", () => {
  it("shows the entry's authored one-line desc under the title (dh-detail-desc)", () => {
    const c = renderMain("salt", "dl-color");
    const desc = c.querySelector(".dh-detail-desc");
    expect(desc).not.toBeNull();
    expect(desc?.textContent).toContain("8 foundation ramps");
  });

  it("shows the desc for M3 guide-* foundations too", () => {
    const c = renderMain("m3", "guide-color-roles");
    expect(c.querySelector(".dh-detail-desc")?.textContent).toContain(
      "what each accent color group is for",
    );
  });

  it("renders the Code section below the content for a foundation WITH authored snippets (salt dl-color)", async () => {
    const c = renderMain("salt", "dl-color");
    await flushAsync();
    const code = c.querySelector("#dh-sec-code");
    expect(code).not.toBeNull();
    expect(code?.querySelector(".dh-section-h")?.textContent).toBe("Code");
    /* Same house code-block styling: the shared <CodeBlock> pre. */
    expect(code?.querySelector('pre[aria-label="Code example"]')).not.toBeNull();
    /* Below the foundation content: the section is the last child of the page. */
    const page = c.querySelector(".dh-detail");
    expect(page?.lastElementChild?.id).toBe("dh-sec-code");
  });

  it("renders NO Code section for a foundation WITHOUT authored snippets (m3 shape-tokens)", async () => {
    const c = renderMain("m3", "shape-tokens");
    await flushAsync();
    expect(c.querySelector("#dh-sec-code")).toBeNull();
    /* And no 'authored snippet pending' skeleton fallback either. */
    expect(c.textContent).not.toContain("authored snippet coming soon");
  });
});

/* ── Contrast: eyebrow + context line must clear WCAG AA 4.5:1 for small
   text against the page background. The measured failures that forced the
   role switch: M3 light fg3 #79747E on #FEF7FF ≈ 4.32:1 and uoaui dark fg3
   #6B7280 on #0B1120 ≈ 3.9:1. Per-theme proof across ALL shipped default
   themes lives in foundationContrast.test.ts; here we assert the RENDERED
   colours on the two previously-failing themes. ── */
const rgbToHex = (rgb: string): string => {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb; // already hex
  return (
    "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("")
  );
};

describe("FoundationPage header text contrast (WCAG AA small text)", () => {
  const CASES: Array<{
    system: SystemId; themeState: Record<string, unknown>; id: string; bg: string;
  }> = [
    {
      system: "m3",
      themeState: { m3: { themeKey: "light", density: 0, customColor: "#6750A4", isDarkCustom: false } },
      id: "guide-color-roles",
      bg: getTheme("m3", "light").surface,
    },
    {
      system: "uoaui",
      themeState: { uoaui: { themeKey: "dark", density: "medium", accentColor: "#8A58C9" } },
      id: "dl-color",
      bg: getTheme("uoaui", "dark").bg,
    },
  ];

  for (const { system, themeState, id, bg } of CASES) {
    it(`eyebrow + context + desc clear 4.5:1 on ${system}`, () => {
      const c = renderMain(system, id, themeState);
      for (const sel of [".dh-foundation-eyebrow", ".dh-foundation-context", ".dh-detail-desc"]) {
        const el = c.querySelector<HTMLElement>(sel);
        expect(el, sel).not.toBeNull();
        const ratio = contrastRatio(rgbToHex(el!.style.color), bg);
        expect(ratio, `${sel} on ${system} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
