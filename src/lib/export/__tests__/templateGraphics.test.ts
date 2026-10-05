import { describe, it, expect } from "vitest";
import { analyticsHome } from "@/lib/issuerTemplates";
import { ANALYTICS_WAVES } from "@/lib/templateReferenceAssets";
import { HTML_DIALECT, JSX_DIALECT, launcherCardLines } from "../reportMarkup";
import { REPORT_BLOCKS_CSS } from "../stylesCss";

describe("reference graphics survive handoff", () => {
  for (const dialect of [HTML_DIALECT, JSX_DIALECT]) {
    it(`embeds the four distinct original report thumbnails in ${dialect.cls}`, () => {
      const cards = analyticsHome.body.filter((b) => b.type === "LauncherCard");
      const graphics = cards.map((card) => {
        const markup = launcherCardLines(dialect, card).join("\n");
        const source = markup.match(/src="(data:image\/svg\+xml[^\"]+)"/)?.[1];
        expect(source, `${card.props.title} must not export an empty thumbnail`).toBeTruthy();
        return source;
      });
      expect(new Set(graphics).size).toBe(4);
    });
  }

  it("the export draws the embedded waves behind the hero, in either mode", () => {
    expect(REPORT_BLOCKS_CSS).toContain(`.hero-reference::before { content: ""; position: absolute; z-index: -1;`);
    expect(REPORT_BLOCKS_CSS).toContain(`url("${ANALYTICS_WAVES}")`);
    expect(REPORT_BLOCKS_CSS).toContain('.dashboard-layout[data-mode="dark"] .launcher-thumb img');
  });

  /* The source paints a white page behind its waves; on a dark surface that
     was a white band. The waves stay transparent, with their edge fades as a
     mask, so they sit on any surface. */
  it("the waves carry no opaque backing and fade through a mask", () => {
    const svg = decodeURIComponent(ANALYTICS_WAVES.replace("data:image/svg+xml,", ""));
    /* What is painted is everything outside <defs>: only gradient strokes. */
    const painted = svg.replace(/<defs>[\s\S]*<\/defs>/, "");
    expect(painted).not.toBe(svg);
    expect(painted).not.toMatch(/<rect\b/);
    expect(painted).not.toMatch(/fill="(?!none")/);
    expect((painted.match(/<path\b[^>]*stroke="url\(#/g) ?? []).length).toBeGreaterThan(40);
    /* The strokes sit in one group masked by the fades the source drew in white. */
    expect(painted).toMatch(/<g mask="url\(#fade_[\w]+\)">/);
    const mask = svg.match(/<mask id="fade_[\w]+"[\s\S]*?<\/mask>/)?.[0] ?? "";
    expect((mask.match(/<rect\b/g) ?? []).length).toBe(5);
  });
});
