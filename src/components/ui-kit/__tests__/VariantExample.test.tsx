/* ════════════════════════════════════════════════════════════
   VariantExample — renders a component-appropriate example per type.
   Uses react-dom/client + act() (no RTL), matching the repo pattern.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VariantExample } from "../VariantExample";
import { COMPONENT_VARIANT_NAMING, COMPONENT_ANATOMY } from "@/data/ui-kit-meta";

/* Semantic slots are supplied as rgb() strings so inline-style assertions
   compare directly against what jsdom normalises hex values to. */
const t = {
  bg: "#111111", bg2: "#222222", fg: "#ffffff", fg2: "#aaaaaa",
  accent: "#6750A4", accentText: "#ffffff", border: "#333333", font: "system-ui",
  accentWeak: "rgb(40, 30, 70)", accentFg: "rgb(250, 250, 250)",
  successStrong: "rgb(0, 120, 60)", successStrongFg: "rgb(240, 255, 245)",
  warningStrong: "rgb(180, 120, 0)", warningStrongFg: "rgb(30, 20, 0)",
  dangerStrong: "rgb(170, 0, 0)", dangerStrongFg: "rgb(255, 240, 240)",
  successBg: "rgb(10, 50, 25)", successFg: "rgb(120, 230, 170)",
  warningBg: "rgb(60, 45, 5)", warningFg: "rgb(250, 200, 90)",
  dangerBg: "rgb(60, 10, 10)", dangerFg: "rgb(255, 1, 2)",
  infoBg: "rgb(10, 25, 60)", infoFg: "rgb(120, 180, 255)",
} as never;

/* jsdom-normalised forms of the hex mock values above. */
const ACCENT_RGB = "rgb(103, 80, 164)";
const ACCENT_FG_RGB = "rgb(250, 250, 250)";
const FG2_RGB = "rgb(170, 170, 170)";
const BG2_RGB = "rgb(34, 34, 34)";
const BORDER_RGB = "rgb(51, 51, 51)";

let root: Root | null = null;
afterEach(() => {
  if (root) { const r = root; act(() => r.unmount()); root = null; }
});

function render(componentId: string, style: string): HTMLElement {
  const c = document.createElement("div");
  document.body.appendChild(c);
  act(() => {
    root = createRoot(c);
    root.render(<VariantExample componentId={componentId} style={style} label="Ex" t={t} />);
  });
  return c;
}

/** Anchored badges overlay an absolutely-positioned marker on a host glyph. */
function overlay(c: HTMLElement): HTMLElement | undefined {
  return Array.from(c.querySelectorAll<HTMLElement>("span")).find(
    (el) => el.style.position === "absolute",
  );
}

/** The neutral 24px host glyph that anchored badges attach to. */
function hostGlyph(c: HTMLElement): HTMLElement | undefined {
  return Array.from(c.querySelectorAll<HTMLElement>("span")).find(
    (el) => el.style.width === "24px",
  );
}

describe("VariantExample", () => {
  it("renders a labelled pill example for button", () => {
    expect(render("button", "solid").textContent).toContain("Ex");
  });

  it("renders a card-shaped example for card (a container, not the label)", () => {
    const c = render("card", "elevated");
    expect(c.querySelector("div")).toBeTruthy();
    expect(c.textContent).not.toContain("Ex");
  });

  it("renders an input-shaped example for textInput", () => {
    expect(render("textInput", "filled").textContent).toContain("Value");
  });

  it("renders nothing for a component without an example shape", () => {
    expect(render("avatar", "image").childElementCount).toBe(0);
  });

  it("renders a labelled chip with a leading icon for chip assist", () => {
    const c = render("chip", "assist");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelectorAll(".material-symbols-outlined").length).toBe(1);
  });

  it("renders a leading check on the selected tonal chip for chip filter", () => {
    const c = render("chip", "filter");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelector(".material-symbols-outlined")?.textContent).toBe("check");
  });

  it("renders a trailing remove affordance for chip input", () => {
    const c = render("chip", "input");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelector(".material-symbols-outlined")?.textContent).toBe("close");
  });

  it("renders a plain outlined chip with no icon for chip suggestion", () => {
    const c = render("chip", "suggestion");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("renders an iconless 6px dot for badge dot", () => {
    const c = render("badge", "dot");
    expect(c.querySelectorAll(".material-symbols-outlined").length).toBe(0);
    const dot = Array.from(c.querySelectorAll<HTMLElement>("span")).find(
      (el) => el.style.width === "6px",
    );
    expect(dot).toBeTruthy();
    expect(dot?.style.height).toBe("6px");
  });

  it("renders the counter label for badge count", () => {
    expect(render("badge", "count").textContent).toContain("3");
  });

  /* ── Salt chips ── */

  it("renders a selected pill with accentWeak fill and accent border for chip salt-pill", () => {
    const c = render("chip", "salt-pill");
    const pill = c.querySelector<HTMLElement>("span");
    expect(c.textContent).toContain("Ex");
    expect(pill?.style.height).toBe("20px");
    expect(pill?.style.borderRadius).toBe("4px");
    expect(pill?.style.background).toBe("rgb(40, 30, 70)");
    expect(pill?.style.border).toBe(`1px solid ${ACCENT_RGB}`);
    expect(c.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("renders one trailing 14px close icon on a neutral fill for chip salt-tag", () => {
    const c = render("chip", "salt-tag");
    const tag = c.querySelector<HTMLElement>("span");
    expect(c.textContent).toContain("Ex");
    expect(tag?.style.height).toBe("20px");
    expect(tag?.style.borderRadius).toBe("4px");
    expect(tag?.style.background).toBe(BG2_RGB);
    expect(tag?.style.border).toBe(`1px solid ${BORDER_RGB}`);
    const icons = c.querySelectorAll<HTMLElement>(".material-symbols-outlined");
    expect(icons.length).toBe(1);
    expect(icons[0].textContent).toBe("close");
    expect(icons[0].style.fontSize).toBe("14px");
    expect(icons[0].style.color).toBe(FG2_RGB);
  });

  /* ── Salt badges (anchored, like the M3 count badge) ── */

  it("renders an anchored accent counter for badge salt-accent", () => {
    const c = render("badge", "salt-accent");
    expect(hostGlyph(c)).toBeTruthy();
    const o = overlay(c);
    expect(o?.textContent).toBe("3");
    expect(o?.style.height).toBe("16px");
    expect(o?.style.minWidth).toBe("16px");
    expect(o?.style.borderRadius).toBe("8px");
    expect(o?.style.background).toBe(ACCENT_RGB);
    expect(o?.style.color).toBe(ACCENT_FG_RGB);
  });

  it("renders the successStrong fill for badge salt-positive", () => {
    const o = overlay(render("badge", "salt-positive"));
    expect(o?.textContent).toBe("3");
    expect(o?.style.background).toBe("rgb(0, 120, 60)");
    expect(o?.style.color).toBe("rgb(240, 255, 245)");
  });

  it("renders the warningStrong fill for badge salt-caution", () => {
    const o = overlay(render("badge", "salt-caution"));
    expect(o?.textContent).toBe("3");
    expect(o?.style.background).toBe("rgb(180, 120, 0)");
    expect(o?.style.color).toBe("rgb(30, 20, 0)");
  });

  it("uses the dangerStrong slot when provided for badge salt-negative", () => {
    const o = overlay(render("badge", "salt-negative"));
    expect(o?.textContent).toBe("3");
    expect(o?.style.background).toBe("rgb(170, 0, 0)");
    expect(o?.style.color).toBe("rgb(255, 240, 240)");
  });

  it("renders an 8px accent dot on the host glyph for badge salt-dot", () => {
    const c = render("badge", "salt-dot");
    expect(hostGlyph(c)).toBeTruthy();
    const dot = Array.from(c.querySelectorAll<HTMLElement>("span")).find(
      (el) => el.style.width === "8px",
    );
    expect(dot).toBeTruthy();
    expect(dot?.style.height).toBe("8px");
    expect(dot?.style.background).toBe(ACCENT_RGB);
    expect(c.textContent).not.toContain("3");
  });

  /* ── Fluent badges (a bare appearance ladder, no host glyph) ── */

  it("renders a bare filled counter pill without a host glyph for badge fluent-filled", () => {
    const c = render("badge", "fluent-filled");
    expect(hostGlyph(c)).toBeUndefined();
    const pill = c.querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("3");
    expect(pill?.style.height).toBe("20px");
    expect(pill?.style.minWidth).toBe("20px");
    expect(pill?.style.borderRadius).toBe("10px");
    expect(pill?.style.background).toBe(ACCENT_RGB);
    expect(pill?.style.color).toBe(ACCENT_FG_RGB);
  });

  it("renders an accent color-mix tint fill and border for badge fluent-tint", () => {
    const pill = render("badge", "fluent-tint").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("3");
    expect(pill?.style.background).toContain("color-mix");
    expect(pill?.style.border).toContain("color-mix");
    expect(pill?.style.color).toBe(ACCENT_RGB);
  });

  it("renders an accent outline on a transparent fill for badge fluent-outline", () => {
    const pill = render("badge", "fluent-outline").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("3");
    expect(pill?.style.background).toBe("transparent");
    expect(pill?.style.border).toBe(`1px solid ${ACCENT_RGB}`);
    expect(pill?.style.color).toBe(ACCENT_RGB);
  });

  it("renders no background and no border for badge fluent-ghost", () => {
    const pill = render("badge", "fluent-ghost").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("3");
    expect(pill?.style.background).toBe("");
    expect(pill?.style.border).toBe("");
    expect(pill?.style.color).toBe(ACCENT_RGB);
  });

  /* ── uoaui glass badges (bare labelled pills, no host glyph) ── */

  it("renders a Beta pill with a translucent accent color-mix fill for badge glass-accent", () => {
    const c = render("badge", "glass-accent");
    expect(hostGlyph(c)).toBeUndefined();
    const pill = c.querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("Beta");
    expect(pill?.style.height).toBe("22px");
    expect(pill?.style.borderRadius).toBe("9999px");
    expect(pill?.style.background).toContain("color-mix");
    expect(pill?.style.color).toBe(FG2_RGB);
    expect(pill?.style.border).toBe(`1px solid ${BORDER_RGB}`);
  });

  it("renders the neutral surface pill for badge glass-default", () => {
    const pill = render("badge", "glass-default").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("Default");
    expect(pill?.style.background).toBe(BG2_RGB);
    expect(pill?.style.color).toBe(FG2_RGB);
    expect(pill?.style.border).toBe(`1px solid ${BORDER_RGB}`);
  });

  it("renders dangerBg with the dangerFg text for badge glass-danger", () => {
    const pill = render("badge", "glass-danger").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("Error");
    expect(pill?.style.background).toBe("rgb(60, 10, 10)");
    expect(pill?.style.color).toBe("rgb(255, 1, 2)");
    expect(pill?.style.border).toContain("color-mix");
  });

  it("renders successBg with the successFg text for badge glass-success", () => {
    const pill = render("badge", "glass-success").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("Done");
    expect(pill?.style.background).toBe("rgb(10, 50, 25)");
    expect(pill?.style.color).toBe("rgb(120, 230, 170)");
  });

  it("renders warningBg with the warningFg text for badge glass-warning", () => {
    const pill = render("badge", "glass-warning").querySelector<HTMLElement>("span");
    expect(pill?.textContent).toBe("Hold");
    expect(pill?.style.background).toBe("rgb(60, 45, 5)");
    expect(pill?.style.color).toBe("rgb(250, 200, 90)");
  });

  /* ── Carbon tags (the Tag family at Carbon metrics on the chip branch) ── */

  it("renders the gray default fill at Carbon md metrics for chip carbon-tag", () => {
    const c = render("chip", "carbon-tag");
    const tag = c.querySelector<HTMLElement>("span");
    expect(c.textContent).toContain("Ex");
    expect(tag?.style.height).toBe("24px");
    expect(tag?.style.borderRadius).toBe("16px");
    expect(tag?.style.background).toContain("color-mix");
    expect(c.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("renders one trailing 16px close icon on the red tag pair for chip carbon-dismissible", () => {
    const c = render("chip", "carbon-dismissible");
    const tag = c.querySelector<HTMLElement>("span");
    expect(c.textContent).toContain("Ex");
    expect(tag?.style.background).toBe("rgb(60, 10, 10)");
    expect(tag?.style.color).toBe("rgb(255, 1, 2)");
    const icons = c.querySelectorAll<HTMLElement>(".material-symbols-outlined");
    expect(icons.length).toBe(1);
    expect(icons[0].textContent).toBe("close");
    expect(icons[0].style.fontSize).toBe("16px");
  });

  it("renders the selected high-contrast inverse fill for chip carbon-selectable", () => {
    const c = render("chip", "carbon-selectable");
    const tag = c.querySelector<HTMLElement>("span");
    expect(tag?.style.height).toBe("24px");
    expect(tag?.style.background).toBe("rgb(255, 255, 255)");
    expect(tag?.style.color).toBe("rgb(17, 17, 17)");
    expect(c.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("renders the blue tag pair with a hairline currentColor border for chip carbon-operational", () => {
    const tag = render("chip", "carbon-operational").querySelector<HTMLElement>("span");
    expect(tag?.style.background).toBe("rgb(10, 25, 60)");
    expect(tag?.style.color).toBe("rgb(120, 180, 255)");
    expect(tag?.style.border).toContain("color-mix");
  });

  /* ── Meta registration: cross-worktree contract ──
     The new DS entries below are authored in the sibling worktree's
     ui-kit-meta.ts; these assertions pin the agreed style keys + names
     and go green after merge. */

  // CONTRACT: fails locally until the sibling worktree's meta data merges.
  it("registers the Salt chip styles in COMPONENT_VARIANT_NAMING under chip", () => {
    const salt = COMPONENT_VARIANT_NAMING.chip?.salt ?? [];
    expect(salt.map((v) => v.style)).toEqual(["salt-pill", "salt-tag"]);
    expect(salt.map((v) => v.name)).toEqual(["Pill", "Tag"]);
  });

  // CONTRACT: fails locally until the sibling worktree's meta data merges.
  it("registers the Salt badge styles in COMPONENT_VARIANT_NAMING under badge", () => {
    const salt = COMPONENT_VARIANT_NAMING.badge?.salt ?? [];
    expect(salt.map((v) => v.style)).toEqual([
      "salt-accent",
      "salt-positive",
      "salt-caution",
      "salt-negative",
      "salt-dot",
    ]);
    expect(salt.map((v) => v.name)).toEqual(["Accent", "Positive", "Caution", "Negative", "Dot"]);
  });

  // CONTRACT: fails locally until the sibling worktree's meta data merges.
  it("registers the Fluent badge styles in COMPONENT_VARIANT_NAMING under badge", () => {
    const fluent = COMPONENT_VARIANT_NAMING.badge?.fluent ?? [];
    expect(fluent.map((v) => v.style)).toEqual([
      "fluent-filled",
      "fluent-tint",
      "fluent-outline",
      "fluent-ghost",
    ]);
    expect(fluent.map((v) => v.name)).toEqual(["Filled", "Tint", "Outline", "Ghost"]);
  });

  // CONTRACT: fails locally until the sibling worktree's meta data merges.
  it("registers the uoaui glass badge styles in COMPONENT_VARIANT_NAMING under badge", () => {
    const glass = COMPONENT_VARIANT_NAMING.badge?.uoaui ?? [];
    expect(glass.map((v) => v.style)).toEqual([
      "glass-accent",
      "glass-default",
      "glass-danger",
      "glass-success",
      "glass-warning",
    ]);
    expect(glass.map((v) => v.name)).toEqual(["Accent", "Default", "Danger", "Success", "Warning"]);
  });

  it("registers the Carbon Tag family in COMPONENT_VARIANT_NAMING under chip", () => {
    const carbon = COMPONENT_VARIANT_NAMING.chip?.carbon ?? [];
    expect(carbon.map((v) => v.style)).toEqual([
      "carbon-tag",
      "carbon-dismissible",
      "carbon-selectable",
      "carbon-operational",
    ]);
    expect(carbon.map((v) => v.name)).toEqual([
      "Read-only",
      "Dismissible",
      "Selectable",
      "Operational",
    ]);
  });

  it("registers Carbon tag anatomy with the dist-verified md metrics", () => {
    const a = COMPONENT_ANATOMY.chip?.carbon;
    expect(a?.parts.length).toBeGreaterThan(0);
    expect(a?.measures).toContainEqual({ label: "Height", value: "24dp" });
    expect(a?.measures).toContainEqual({ label: "Corner", value: "16dp" });
  });

  it("keeps badge.carbon absent (no real @carbon/react Badge ships; Tag is chip semantics)", () => {
    expect(COMPONENT_VARIANT_NAMING.badge?.carbon).toBeUndefined();
    expect(COMPONENT_ANATOMY.badge?.carbon).toBeUndefined();
  });

  it("registers the four M3 chip types in COMPONENT_VARIANT_NAMING under chip", () => {
    expect((COMPONENT_VARIANT_NAMING.chip?.m3 ?? []).map((v) => v.style)).toEqual([
      "assist",
      "filter",
      "input",
      "suggestion",
    ]);
  });

  it("registers M3 chip anatomy for the Specs anatomy section", () => {
    expect(COMPONENT_ANATOMY.chip?.m3?.parts.length).toBeGreaterThan(0);
  });

  it("registers the M3 dot + count badge types in COMPONENT_VARIANT_NAMING under badge", () => {
    expect((COMPONENT_VARIANT_NAMING.badge?.m3 ?? []).map((v) => v.style)).toEqual([
      "dot",
      "count",
    ]);
  });

  it("registers M3 count-badge anatomy for the Specs anatomy section", () => {
    expect(COMPONENT_ANATOMY.badge?.m3?.parts.length).toBeGreaterThan(0);
  });
});
