import { describe, it, expect } from "vitest";
import { analyticsHome } from "@/lib/issuerTemplates";
import { HTML_DIALECT, JSX_DIALECT, launcherCardLines } from "../reportMarkup";

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
});
