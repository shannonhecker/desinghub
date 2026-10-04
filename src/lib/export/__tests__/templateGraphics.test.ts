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
    expect(svg).not.toContain('<rect width="1920" height="450" fill="white"/>\n<path');
    expect(svg).toContain('<g mask="url(#fade_2045_298187)">');
    expect(svg).not.toMatch(/<rect[^>]*fill="url\(#paint5[0-3]_linear/);
  });
});
