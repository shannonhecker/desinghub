import { describe, it, expect, beforeEach } from "vitest";
import { applyTemplateToCanvas, openTemplateLink } from "../applyTemplate";
import { BUILDER_TEMPLATES, INDIVIDUAL_TEMPLATE_ORDER, TEMPLATE_ORDER, WORKSPACE_TEMPLATE_ID, templateCategory } from "../builderTemplates";
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
    applyTemplateToCanvas(BUILDER_TEMPLATES["landing-page"], "salt");
    const s = useBuilder.getState();
    expect(s.pages).toEqual([]);
    expect(s.activePageId).toBeNull();
    expect(s.blocks).toEqual(BUILDER_TEMPLATES["landing-page"].body);
  });

  it("a template with its own pages carries only those pages", () => {
    useBuilder.setState({ pages: [{ id: "p1", name: "Old one", body: [] }, { id: "p2", name: "Old two", body: [] }], activePageId: "p2" } as never);
    const tpl = BUILDER_TEMPLATES["analytics-dashboard"];
    applyTemplateToCanvas(tpl, "salt");
    const s = useBuilder.getState();
    expect(s.pages.map((p) => p.id)).toEqual([tpl.sidebar[0].id, ...tpl.pages!.map((p) => p.id)]);
    expect(s.activePageId).toBe(tpl.sidebar[0].id);
    expect(s.blocks).toEqual(tpl.body);
  });
});

/* An individual template is one standalone report. Only the connected
   workspace (Analytics Home, and the reports opened from inside it) carries
   links between templates. */
describe("standalone templates and the connected workspace", () => {
  const crossLinks = () => {
    const s = useBuilder.getState();
    const out: string[] = [];
    for (const b of [...s.headerBlocks, ...s.sidebarBlocks, ...s.blocks, ...s.footerBlocks]) {
      if (b.props.templates && Object.keys(b.props.templates as object).length > 0) out.push(`${b.type}.templates`);
      if (typeof b.props.templateId === "string" && b.props.templateId !== s.activeTemplateId) out.push(`${b.type}:${b.props.templateId}`);
    }
    return out;
  };

  it("the individual list leaves the workspace out", () => {
    expect(INDIVIDUAL_TEMPLATE_ORDER).not.toContain(WORKSPACE_TEMPLATE_ID);
    expect(INDIVIDUAL_TEMPLATE_ORDER).toHaveLength(TEMPLATE_ORDER.length - 1);
    expect(INDIVIDUAL_TEMPLATE_ORDER.filter((id) => templateCategory(id) === "finance")).toHaveLength(12);
  });

  for (const id of INDIVIDUAL_TEMPLATE_ORDER) {
    it(`${id}: applied on its own, it links to no other template and every nav item has content`, () => {
      applyTemplateToCanvas(BUILDER_TEMPLATES[id], "salt");
      expect(crossLinks()).toEqual([]);
      const s = useBuilder.getState();
      const tabs = s.headerBlocks.find((b) => b.type === "TabStrip");
      if (tabs) expect(String(tabs.props.tabsCsv)).toBe(String(tabs.props.active));
      const pageIds = new Set(s.pages.map((p) => p.id));
      for (const [i, nav] of s.sidebarBlocks.filter((b) => b.type === "NavItem").entries()) {
        const current = nav.props.active === true || (i === 0 && !s.sidebarBlocks.some((b) => b.props.active === true));
        expect(current || pageIds.has(nav.id), `${nav.props.label}`).toBe(true);
      }
      /* A group heading is kept only while it still has an item under it. */
      s.sidebarBlocks.forEach((b, i) => {
        if (b.type === "NavGroup") expect(s.sidebarBlocks[i + 1]?.type).toBe("NavItem");
      });
    });
  }

  it("the workspace keeps its links, and so does a report opened from inside it", () => {
    applyTemplateToCanvas(BUILDER_TEMPLATES[WORKSPACE_TEMPLATE_ID], "salt");
    expect(crossLinks().length).toBeGreaterThan(0);
    openTemplateLink(BUILDER_TEMPLATES["esg-analytics"], "salt");
    const s = useBuilder.getState();
    expect((s.headerBlocks.find((b) => b.type === "TabStrip")!.props.templates as Record<string, string>).Home).toBe(WORKSPACE_TEMPLATE_ID);
    expect(s.sidebarBlocks.filter((b) => b.type === "NavItem" && b.props.templateId).length).toBeGreaterThan(1);
  });

  it("the template definitions themselves are not changed by a standalone apply", () => {
    const before = JSON.stringify(BUILDER_TEMPLATES["esg-analytics"]);
    applyTemplateToCanvas(BUILDER_TEMPLATES["esg-analytics"], "salt");
    expect(JSON.stringify(BUILDER_TEMPLATES["esg-analytics"])).toBe(before);
  });
});
