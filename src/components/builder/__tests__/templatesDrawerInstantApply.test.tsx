/* ════════════════════════════════════════════════════════════
   TemplatesDrawer instant apply (builder UX quick win QW5).
   ════════════════════════════════════════════════════════════
   Clicking a template card must produce a CANVAS, not a question:
   the template applies immediately in the store's current design
   system, and the "which DS?" turn becomes a NON-BLOCKING follow-up
   offer (the existing pendingTemplateId staging keeps the DS reply
   chips rendered under the AI turn; tapping one re-applies the same
   template in the chosen DS, which is lossless via the
   templates-as-DS-framework registry).

   Uses react-dom/client + React act() directly (no RTL in the repo).
   TemplatePreviews is mocked out - SVG wireframes are irrelevant here.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { usePreviewMode } from "@/store/usePreviewMode";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER } from "@/lib/builderTemplates";

vi.mock("../TemplatePreviews", () => ({
  TemplatePreview: () => null,
}));

import { TemplatesDrawer } from "../TemplatesDrawer";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  useBuilder.setState({
    templatesDrawerOpen: true,
    designSystem: "salt",
    messages: [],
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    activeTemplateId: null,
    pendingTemplateId: null,
    pendingFirstMessage: null,
    isGenerating: false,
    previewOpen: false,
  });
  usePreviewMode.setState({ mode: "edit" });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

function mountDrawer() {
  act(() => {
    root = createRoot(container!);
    root.render(<TemplatesDrawer />);
  });
}

function clickFirstCard() {
  const card = container!.querySelector<HTMLButtonElement>(
    ".templates-drawer-card",
  );
  expect(card).not.toBeNull();
  act(() => card!.click());
}

describe("TemplatesDrawer instant apply (QW5)", () => {
  it("applies the template immediately in the current design system", () => {
    mountDrawer();
    clickFirstCard();

    const s = useBuilder.getState();
    const tpl = BUILDER_TEMPLATES[TEMPLATE_ORDER[0]];

    // Canvas populated NOW - no DS gate between click and content.
    expect(s.activeTemplateId).toBe(tpl.id);
    expect(s.blocks.length).toBeGreaterThan(0);
    expect(s.headerBlocks.length).toBeGreaterThan(0);
    // Current DS respected, not silently changed.
    expect(s.designSystem).toBe("salt");
    // Drawer closes, preview opens on the rendered result.
    expect(s.templatesDrawerOpen).toBe(false);
    expect(s.previewOpen).toBe(true);
    expect(usePreviewMode.getState().mode).toBe("preview");
  });

  it("follows with a non-blocking DS offer instead of a blocking question", () => {
    mountDrawer();
    clickFirstCard();

    const s = useBuilder.getState();
    const last = s.messages[s.messages.length - 1];
    expect(last.role).toBe("ai");
    // Offer copy: states the DS it was built in + comma list of the rest.
    expect(last.content).toContain("Built in Salt DS");
    expect(last.content).toContain("Material 3");
    expect(last.content).toContain("Fluent 2");
    expect(last.content).toContain("Carbon");
    expect(last.content).toContain("uoaui");
    // The old blocking question is gone.
    expect(last.content).not.toMatch(/which design system should i use/i);
    // No em or en dashes in display copy (house rule).
    expect(last.content).not.toMatch(/[–—]/);
    // Template stays staged so the existing DS reply chips render under
    // this turn - tapping one swaps the canvas DS losslessly.
    expect(s.pendingTemplateId).toBe(TEMPLATE_ORDER[0]);
  });

  it("keeps the staged swap path lossless for a follow-up DS pick", () => {
    mountDrawer();
    clickFirstCard();

    // Simulate the existing DS chip mechanism (applyPendingIntentWithDs
    // case 1 re-applies the staged template with the chosen DS).
    const tplId = useBuilder.getState().pendingTemplateId!;
    const tpl = BUILDER_TEMPLATES[tplId as typeof TEMPLATE_ORDER[number]];
    const before = useBuilder.getState().blocks.length;

    act(() => {
      useBuilder.getState().setDesignSystem("m3");
    });

    expect(useBuilder.getState().designSystem).toBe("m3");
    // Same template payload still on canvas - the swap loses nothing.
    expect(useBuilder.getState().blocks.length).toBe(before);
    expect(useBuilder.getState().activeTemplateId).toBe(tpl.id);
  });

  it("ignores clicks while generating", () => {
    useBuilder.setState({ isGenerating: true });
    mountDrawer();
    clickFirstCard();

    const s = useBuilder.getState();
    expect(s.activeTemplateId).toBeNull();
    expect(s.messages.length).toBe(0);
  });
});
