import { describe, expect, it } from "vitest";
import { LIBRARY_BLUEPRINTS } from "../blockRegistry";
import { SHARE_BLOCK_TYPES } from "../shareBlockTypes";
import { BUILDER_TEMPLATES } from "../builderTemplates";
import { decodeShareState, encodeShareState, type SharedCanvas } from "../shareState";

describe("server-safe share block catalogue", () => {
  it("contains exactly the registered block types", () => {
    expect([...SHARE_BLOCK_TYPES].sort()).toEqual(LIBRARY_BLUEPRINTS.map(b => b.type).sort());
  });

  it("allows every shipped template through the shared-link boundary", () => {
    for (const template of Object.values(BUILDER_TEMPLATES)) {
      const payload: SharedCanvas = {
        v: 1, designSystem: "salt", mode: "light", density: "medium",
        canvasSpacing: "tight", deviceMode: "desktop", themeKey: null, activeTemplateId: template.id,
        blocks: template.body, headerBlocks: template.header,
        sidebarBlocks: template.sidebar, footerBlocks: template.footer,
      };
      expect(decodeShareState(encodeShareState(payload)), template.id).not.toBeNull();
    }
  });
});
