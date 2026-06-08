import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder, type ZoneId, type ZoneLayout } from "@/store/useBuilder";
import { exportReact } from "../export/reactExporter";
import { exportHTML } from "../export/htmlExporter";

/* P2 Frames — THE EXPORT TRAP guard.
   A peripheral frame the user removed (zoneLayouts[zone].visible === false)
   must NOT reach the generated code, or the export diverges from the canvas.
   These tests pin BOTH export sinks (React + HTML) and prove:
     - a hidden zone WITH retained blocks is dropped from the output
     - the body and still-visible zones survive
     - the default (undefined visible) still emits every zone (back-compat) */

const VISIBLE_DEFAULTS: Record<ZoneId, ZoneLayout> = {
  body: { mode: "grid", columns: 12, gap: 12, align: "start" },
  header: { mode: "row", gap: 8, wrap: false, align: "center" },
  sidebar: { mode: "stack", gap: 2, align: "stretch" },
  footer: { mode: "row", gap: 8, wrap: false, align: "center" },
};

function seedAllZones() {
  useBuilder.setState({
    designSystem: "salt" as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [{ id: "h1", type: "AppBrand", props: { label: "BrandMarker" } }] as never,
    sidebarBlocks: [{ id: "s1", type: "NavItem", props: { label: "NavMarker", icon: "chat" } }] as never,
    blocks: [{ id: "b1", type: "SimulatedButton", props: { label: "BodyMarker", variant: "primary" } }] as never,
    footerBlocks: [{ id: "f1", type: "FooterText", props: { label: "FootMarker", version: "v1" } }] as never,
    zoneLayouts: { ...VISIBLE_DEFAULTS },
  });
}

function setZoneVisibleFlag(zone: Exclude<ZoneId, "body">, visible: boolean) {
  const cur = useBuilder.getState().zoneLayouts;
  useBuilder.setState({ zoneLayouts: { ...cur, [zone]: { ...cur[zone], visible } } });
}

describe("export drops a removed peripheral frame (React + HTML)", () => {
  beforeEach(seedAllZones);

  it("all zones visible → every zone's content reaches both exports", () => {
    const react = exportReact();
    const html = exportHTML();
    for (const out of [react, html]) {
      expect(out).toContain("BrandMarker");
      expect(out).toContain("NavMarker");
      expect(out).toContain("BodyMarker");
      expect(out).toContain("FootMarker");
    }
  });

  it("hidden header (blocks retained) is dropped from both exports", () => {
    setZoneVisibleFlag("header", false);
    const react = exportReact();
    const html = exportHTML();
    // store still holds the header block (re-add restores it) ...
    expect(useBuilder.getState().headerBlocks.length).toBe(1);
    // ... but neither export emits it.
    expect(react).not.toContain("BrandMarker");
    expect(html).not.toContain("BrandMarker");
    // sibling zones survive.
    expect(react).toContain("BodyMarker");
    expect(react).toContain("NavMarker");
    expect(react).toContain("FootMarker");
  });

  it("hidden sidebar + footer drop together; body always emits", () => {
    setZoneVisibleFlag("sidebar", false);
    setZoneVisibleFlag("footer", false);
    const react = exportReact();
    const html = exportHTML();
    for (const out of [react, html]) {
      expect(out).not.toContain("NavMarker");
      expect(out).not.toContain("FootMarker");
      expect(out).toContain("BodyMarker"); // body is mandatory
      expect(out).toContain("BrandMarker"); // header still visible
    }
  });

  it("re-showing a previously hidden zone brings its content back", () => {
    setZoneVisibleFlag("header", false);
    expect(exportReact()).not.toContain("BrandMarker");
    setZoneVisibleFlag("header", true);
    expect(exportReact()).toContain("BrandMarker");
  });
});

describe("store: setZoneVisible / toggleZoneVisible", () => {
  beforeEach(seedAllZones);

  it("setZoneVisible(body, ...) is a no-op (body is mandatory)", () => {
    const before = useBuilder.getState().zoneLayouts;
    useBuilder.getState().setZoneVisible("body", false);
    // body has no `visible` flag set, and the object reference is unchanged.
    expect(useBuilder.getState().zoneLayouts).toBe(before);
    expect(useBuilder.getState().zoneLayouts.body.visible).toBeUndefined();
  });

  it("setZoneVisible hides + writes a FRESH zoneLayouts object (so history/autosave capture it)", () => {
    const before = useBuilder.getState().zoneLayouts;
    useBuilder.getState().setZoneVisible("footer", false);
    const after = useBuilder.getState().zoneLayouts;
    expect(after).not.toBe(before); // new reference → reference-equality trackers fire
    expect(after.footer.visible).toBe(false);
  });

  it("toggleZoneVisible flips a peripheral zone and is a no-op for body", () => {
    useBuilder.getState().toggleZoneVisible("sidebar");
    expect(useBuilder.getState().zoneLayouts.sidebar.visible).toBe(false);
    useBuilder.getState().toggleZoneVisible("sidebar");
    expect(useBuilder.getState().zoneLayouts.sidebar.visible).toBe(true);
    const ref = useBuilder.getState().zoneLayouts;
    useBuilder.getState().toggleZoneVisible("body");
    expect(useBuilder.getState().zoneLayouts).toBe(ref); // body untouched
  });
});
