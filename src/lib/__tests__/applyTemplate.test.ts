import { describe, it, expect, beforeEach } from "vitest";
import { applyTemplateToCanvas } from "../applyTemplate";
import { BUILDER_TEMPLATES } from "../builderTemplates";
import { useBuilder } from "@/store/useBuilder";

beforeEach(() => {
  useBuilder.setState({ currentSessionId: null, sessionTitle: null, pages: [], activePageId: null } as never);
});

describe("applyTemplateToCanvas", () => {
  /* Auto-save only writes once a session exists. The chat's "Use this" path
     applied a template without starting one, so the canvas - and every edit
     made to it - was never saved and a refresh lost the lot. */
  it("starts a session named after the template, on every apply path", () => {
    applyTemplateToCanvas(BUILDER_TEMPLATES["analytics-dashboard"], "salt");
    const s = useBuilder.getState();
    expect(s.currentSessionId).toMatch(/^sess-/);
    expect(s.sessionTitle).toContain("Analytics Dashboard");
  });

  it("keeps the session that is already running", () => {
    useBuilder.getState().ensureSessionStarted("My risk review");
    const before = useBuilder.getState().currentSessionId;
    applyTemplateToCanvas(BUILDER_TEMPLATES["settings-page"], "m3");
    expect(useBuilder.getState().currentSessionId).toBe(before);
    expect(useBuilder.getState().sessionTitle).toBe("My risk review");
  });

  /* A template can restyle or hide its chrome; the next template must not
     inherit that. */
  it("applies a template's chrome zone layouts and resets them for the next template", () => {
    applyTemplateToCanvas(
      { ...BUILDER_TEMPLATES["analytics-dashboard"], zoneLayouts: { body: { mode: "grid", columns: 12 }, header: { mode: "stack", gap: 0, flush: true, tone: "dark" }, sidebar: { mode: "stack", visible: false }, footer: { mode: "row", visible: false } } },
      "salt",
    );
    let z = useBuilder.getState().zoneLayouts;
    expect(z.header).toEqual({ mode: "stack", gap: 0, flush: true, tone: "dark" });
    expect(z.sidebar.visible).toBe(false);
    expect(z.footer.visible).toBe(false);

    applyTemplateToCanvas(BUILDER_TEMPLATES["settings-page"], "salt");
    z = useBuilder.getState().zoneLayouts;
    expect(z.header).toEqual({ mode: "row", gap: 8, wrap: false, align: "center" });
    expect(z.sidebar.visible).toBeUndefined();
    expect(z.footer.visible).toBeUndefined();
  });

  it("keeps a sidebar width the user dragged", () => {
    useBuilder.getState().setZoneLayout("sidebar", { size: 244 });
    applyTemplateToCanvas(BUILDER_TEMPLATES["analytics-dashboard"], "salt");
    expect(useBuilder.getState().zoneLayouts.sidebar.size).toBe(244);
    useBuilder.getState().setZoneLayout("sidebar", { size: undefined });
  });

  it("drops pages left over from a previous multi-page canvas", () => {
    useBuilder.setState({
      pages: [
        { id: "p1", name: "Old one", body: [] },
        { id: "p2", name: "Old two", body: [] },
      ],
      activePageId: "p2",
    } as never);
    applyTemplateToCanvas(BUILDER_TEMPLATES["analytics-dashboard"], "salt");
    const s = useBuilder.getState();
    expect(s.pages).toEqual([]);
    expect(s.activePageId).toBeNull();
    expect(s.blocks).toEqual(BUILDER_TEMPLATES["analytics-dashboard"].body);
  });
});
