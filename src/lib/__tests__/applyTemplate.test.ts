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
