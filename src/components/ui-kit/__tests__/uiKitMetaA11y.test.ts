/* ════════════════════════════════════════════════════════════
   ui-kit-meta — accessibility data layer + Salt Button anatomy.
   ════════════════════════════════════════════════════════════
   These are pure-data assertions on the two additions made in
   feat/uikit-anatomy-a11y-data:
     - COMPONENT_ACCESSIBILITY: per-component, per-DS keyboard + ARIA notes
       that gate the Accessibility tab (ComponentPreview).
     - COMPONENT_ANATOMY.button.salt: the Salt Button anatomy entry.
   No DOM — the rendering of these is covered by AnatomyDiagram.test.tsx and
   verified visually on the /ui-kit capture. The point here is to guard the
   DATA shape + coverage + the copy rule (no em/en dashes in display strings).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import {
  COMPONENT_ACCESSIBILITY,
  COMPONENT_ANATOMY,
  type UiKitComponentId,
  type DesignSystemId,
} from "@/data/ui-kit-meta";

const DASH = /[—–]/; /* em-dash / en-dash — banned in display copy. */

describe("COMPONENT_ACCESSIBILITY", () => {
  const required: { id: UiKitComponentId; ds: DesignSystemId[] }[] = [
    { id: "button", ds: ["m3", "salt", "fluent", "uoaui", "carbon"] },
    { id: "textInput", ds: ["m3", "salt", "fluent", "uoaui", "carbon"] },
    { id: "checkbox", ds: ["m3", "salt", "fluent", "uoaui", "carbon"] },
    { id: "switch", ds: ["m3", "salt", "fluent", "uoaui", "carbon"] },
  ];

  it("covers button / textInput / checkbox / switch across all five DS", () => {
    for (const { id, ds } of required) {
      const byDs = COMPONENT_ACCESSIBILITY[id];
      expect(byDs, `missing component: ${id}`).toBeDefined();
      for (const d of ds) {
        expect(byDs?.[d], `missing ${id}.${d}`).toBeDefined();
      }
    }
  });

  it("every entry carries a non-empty keyboard map and ARIA list", () => {
    for (const byDs of Object.values(COMPONENT_ACCESSIBILITY)) {
      for (const entry of Object.values(byDs ?? {})) {
        expect(entry!.keyboard.length).toBeGreaterThan(0);
        expect(entry!.aria.length).toBeGreaterThan(0);
        for (const line of [...entry!.keyboard, ...entry!.aria]) {
          expect(line.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("contains no em-dashes or en-dashes in any display string (copy rule)", () => {
    for (const byDs of Object.values(COMPONENT_ACCESSIBILITY)) {
      for (const entry of Object.values(byDs ?? {})) {
        const strings = [...entry!.keyboard, ...entry!.aria];
        if (entry!.contrast) strings.push(entry!.contrast);
        for (const s of strings) {
          expect(DASH.test(s), `dash in: ${s}`).toBe(false);
        }
      }
    }
  });

  it("button keyboard notes mention Enter and Space activation", () => {
    const btn = COMPONENT_ACCESSIBILITY.button!;
    for (const ds of ["m3", "salt", "fluent", "uoaui", "carbon"] as DesignSystemId[]) {
      const kb = btn[ds]!.keyboard.join(" ");
      expect(kb).toMatch(/Enter/);
      expect(kb).toMatch(/Space/);
    }
  });

  it("switch.m3 / switch.uoaui / switch.carbon expose the switch role", () => {
    for (const ds of ["m3", "uoaui", "carbon"] as DesignSystemId[]) {
      const aria = COMPONENT_ACCESSIBILITY.switch![ds]!.aria.join(" ");
      expect(aria).toMatch(/role='switch'|switch/i);
    }
  });
});

describe("COMPONENT_ANATOMY.button.salt", () => {
  it("exists alongside button.m3", () => {
    expect(COMPONENT_ANATOMY.button?.m3).toBeDefined();
    expect(COMPONENT_ANATOMY.button?.salt).toBeDefined();
  });

  it("has three parts and a height measure", () => {
    const salt = COMPONENT_ANATOMY.button!.salt!;
    expect(salt.parts.length).toBe(3);
    expect(salt.measures.some((m) => /height/i.test(m.label))).toBe(true);
  });

  it("uses a flat-Salt corner (4dp), not the M3 full pill", () => {
    const corner = COMPONENT_ANATOMY.button!.salt!.measures.find((m) => /corner/i.test(m.label));
    expect(corner?.value).toBe("4dp");
    expect(COMPONENT_ANATOMY.button!.m3!.measures.find((m) => /corner/i.test(m.label))?.value).toBe("Full");
  });

  it("introduces no px/hex literal in its measure values (token-safe)", () => {
    for (const m of COMPONENT_ANATOMY.button!.salt!.measures) {
      expect(/\d+px\b/.test(m.value)).toBe(false);
      expect(/#[0-9a-fA-F]{3,8}\b/.test(m.value)).toBe(false);
    }
  });
});
