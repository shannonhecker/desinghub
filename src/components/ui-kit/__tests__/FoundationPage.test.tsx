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
import { MainContent } from "../MainContent";

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

function renderMain(activeSystem: SystemId, selectedComponent: string): HTMLElement {
  act(() => {
    useDesignHub.setState({ activeSystem, selectedComponent });
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
