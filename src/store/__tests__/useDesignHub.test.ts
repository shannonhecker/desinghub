import { describe, it, expect, beforeEach } from "vitest";
import { useDesignHub } from "../useDesignHub";

function resetStore() {
  useDesignHub.setState({
    activeSystem: "salt",
    salt: { themeKey: "jpm-dark", density: "medium" },
    m3: { themeKey: "dark", density: 0, customColor: "#6750A4", isDarkCustom: true },
    fluent: { themeKey: "dark", size: "medium" },
    uoaui: { themeKey: "dark", density: "medium", accentColor: "#8A58C9" },
    carbon: { themeKey: "g100", density: "normal" },
    globalMode: "dark",
    globalDensity: 1,
    densityTouched: false,
    selectedComponent: null,
    searchQuery: "",
    activeTab: "preview",
    sidebarOpen: false,
  });
}

describe("useDesignHub", () => {
  beforeEach(resetStore);

  it("setActiveSystem switches DS and resets selection", () => {
    useDesignHub.getState().setSelectedComponent("buttons");
    useDesignHub.getState().setSearchQuery("test");
    useDesignHub.getState().setActiveSystem("m3");

    const state = useDesignHub.getState();
    expect(state.activeSystem).toBe("m3");
    expect(state.selectedComponent).toBeNull();
    expect(state.searchQuery).toBe("");
  });

  it("setSaltTheme updates salt theme key", () => {
    useDesignHub.getState().setSaltTheme("jpm-dark");
    expect(useDesignHub.getState().salt.themeKey).toBe("jpm-dark");
  });

  it("setSaltDensity updates salt density", () => {
    useDesignHub.getState().setSaltDensity("high");
    expect(useDesignHub.getState().salt.density).toBe("high");
  });

  it("setM3CustomColor rejects invalid hex", () => {
    useDesignHub.getState().setM3CustomColor("not-a-hex");
    expect(useDesignHub.getState().m3.customColor).toBe("#6750A4"); // unchanged

    useDesignHub.getState().setM3CustomColor("#fff"); // 3-digit
    expect(useDesignHub.getState().m3.customColor).toBe("#6750A4"); // unchanged
  });

  it("setM3CustomColor accepts valid hex", () => {
    useDesignHub.getState().setM3CustomColor("#FF5733");
    expect(useDesignHub.getState().m3.customColor).toBe("#FF5733");
  });

  it("setUoauiAccent rejects invalid hex", () => {
    useDesignHub.getState().setUoauiAccent("invalid");
    expect(useDesignHub.getState().uoaui.accentColor).toBe("#8A58C9"); // unchanged
  });

  it("setUoauiAccent accepts valid hex", () => {
    useDesignHub.getState().setUoauiAccent("#3D8A82");
    expect(useDesignHub.getState().uoaui.accentColor).toBe("#3D8A82");
  });

  it("toggleSidebar flips sidebarOpen", () => {
    expect(useDesignHub.getState().sidebarOpen).toBe(false);
    useDesignHub.getState().toggleSidebar();
    expect(useDesignHub.getState().sidebarOpen).toBe(true);
    useDesignHub.getState().toggleSidebar();
    expect(useDesignHub.getState().sidebarOpen).toBe(false);
  });

  it("setSelectedComponent resets activeTab to preview", () => {
    useDesignHub.getState().setActiveTab("code");
    useDesignHub.getState().setSelectedComponent("buttons");
    expect(useDesignHub.getState().activeTab).toBe("preview");
    expect(useDesignHub.getState().selectedComponent).toBe("buttons");
  });

  it("mode + density chosen in Salt carry into Carbon on switch", () => {
    // User picks a LIGHT mode + TOUCH density (level 3) in Salt
    useDesignHub.getState().setSaltTheme("jpm-light");
    useDesignHub.getState().setSaltDensity("touch");
    expect(useDesignHub.getState().globalMode).toBe("light");
    expect(useDesignHub.getState().globalDensity).toBe(3);

    useDesignHub.getState().setActiveSystem("carbon");
    const c = useDesignHub.getState().carbon;
    // Carbon must land on a LIGHT shade (white/g10), NOT snap back to g100 dark
    expect(["white", "g10"]).toContain(c.themeKey);
    // Level 3 maps to Carbon 'spacious'
    expect(c.density).toBe("spacious");
  });

  it("M3 density carries into Fluent size on switch", () => {
    // M3 density -2 == level 1 (Compact)
    useDesignHub.getState().setM3Density(-2);
    expect(useDesignHub.getState().globalDensity).toBe(1);
    useDesignHub.getState().setActiveSystem("fluent");
    // Level 1 folds into Fluent 'small'
    expect(useDesignHub.getState().fluent.size).toBe("small");
  });

  it("uoaui light mode carries into M3 on switch", () => {
    useDesignHub.getState().setUoauiTheme("light");
    expect(useDesignHub.getState().globalMode).toBe("light");
    useDesignHub.getState().setActiveSystem("m3");
    const m = useDesignHub.getState().m3;
    expect(m.themeKey).toBe("light");
    expect(m.isDarkCustom).toBe(false);
  });

  it("M3 preserves contrast tier when mode flips on switch", () => {
    // Sit on a high-contrast LIGHT M3 theme, then go dark elsewhere
    useDesignHub.getState().setM3Theme("lightHighContrast");
    expect(useDesignHub.getState().globalMode).toBe("light");
    useDesignHub.getState().setCarbonTheme("g100"); // dark in Carbon
    expect(useDesignHub.getState().globalMode).toBe("dark");
    useDesignHub.getState().setActiveSystem("m3");
    // Tier (HighContrast) preserved, only light->dark flipped
    expect(useDesignHub.getState().m3.themeKey).toBe("darkHighContrast");
  });

  it("Carbon keeps current dark shade (g90) rather than snapping to g100", () => {
    // globalMode is dark by default; sit Carbon on g90 (alt dark)
    useDesignHub.getState().setCarbonTheme("g90");
    expect(useDesignHub.getState().globalMode).toBe("dark");
    // Switch away and back — g90 should survive (still on the dark side)
    useDesignHub.getState().setActiveSystem("salt");
    useDesignHub.getState().setActiveSystem("carbon");
    expect(useDesignHub.getState().carbon.themeKey).toBe("g90");
  });

  /* ── P1-a: no first-visit density regression ──────────────────────────
     A user who NEVER touches density must keep each DS at its own default
     when switching, NOT get the seed globalDensity (level 1) force-folded
     into it (which would push M3 Default(0) -> Compact(-2), Carbon
     Normal -> Compact). */
  it("does not force-fold density into M3 on first visit when untouched", () => {
    expect(useDesignHub.getState().densityTouched).toBe(false);
    useDesignHub.getState().setActiveSystem("m3");
    // M3 keeps its own default density (0 = Default), not the seed-mapped -2
    expect(useDesignHub.getState().m3.density).toBe(0);
  });

  it("does not force-fold density into Carbon on first visit when untouched", () => {
    expect(useDesignHub.getState().densityTouched).toBe(false);
    useDesignHub.getState().setActiveSystem("carbon");
    // Carbon keeps its own default 'normal', not folded to 'compact'
    expect(useDesignHub.getState().carbon.density).toBe("normal");
  });

  it("does not force-fold density into Fluent on first visit when untouched", () => {
    expect(useDesignHub.getState().densityTouched).toBe(false);
    useDesignHub.getState().setActiveSystem("fluent");
    // Fluent keeps its own default 'medium', not folded to 'small'
    expect(useDesignHub.getState().fluent.size).toBe("medium");
  });

  it("any explicit density choice flips densityTouched and carries on switch", () => {
    useDesignHub.getState().setSaltDensity("low"); // level 2
    expect(useDesignHub.getState().densityTouched).toBe(true);
    useDesignHub.getState().setActiveSystem("carbon");
    // Now that density is touched, level 2 maps into Carbon 'normal'
    expect(useDesignHub.getState().carbon.density).toBe("normal");
  });

  /* ── P1-b: level-0 (High) survives a 3-level round-trip ────────────────
     The 3-level DS most-compact value folds abstract levels 0 AND 1, but
     globalDensity is the single source of truth: visiting a 3-level DS must
     not silently demote High(0) to Medium(1). */
  it("Salt High(0) survives a Fluent round-trip", () => {
    useDesignHub.getState().setSaltDensity("high"); // level 0
    expect(useDesignHub.getState().globalDensity).toBe(0);
    useDesignHub.getState().setActiveSystem("fluent");
    // level 0 folds into Fluent 'small'
    expect(useDesignHub.getState().fluent.size).toBe("small");
    // globalDensity stays 0 — NOT clobbered to 1
    expect(useDesignHub.getState().globalDensity).toBe(0);
    useDesignHub.getState().setActiveSystem("salt");
    // back on Salt, density is High again
    expect(useDesignHub.getState().salt.density).toBe("high");
    expect(useDesignHub.getState().globalDensity).toBe(0);
  });

  it("Salt High(0) survives a Carbon round-trip", () => {
    useDesignHub.getState().setSaltDensity("high"); // level 0
    expect(useDesignHub.getState().globalDensity).toBe(0);
    useDesignHub.getState().setActiveSystem("carbon");
    // level 0 folds into Carbon 'compact'
    expect(useDesignHub.getState().carbon.density).toBe("compact");
    expect(useDesignHub.getState().globalDensity).toBe(0);
    useDesignHub.getState().setActiveSystem("salt");
    expect(useDesignHub.getState().salt.density).toBe("high");
    expect(useDesignHub.getState().globalDensity).toBe(0);
  });

  it("explicitly picking Fluent 'small' does not clobber a more-compact level", () => {
    useDesignHub.getState().setSaltDensity("high"); // level 0
    useDesignHub.getState().setActiveSystem("fluent");
    useDesignHub.getState().setFluentSize("small"); // user re-picks small
    // 'small' covers levels 0+1, current is 0 -> stays 0
    expect(useDesignHub.getState().globalDensity).toBe(0);
  });

  it("explicitly picking Fluent 'small' from Medium snaps to its canonical level", () => {
    // globalDensity is the seed 1 (Medium); touch it so the setter path is exercised
    useDesignHub.getState().setUoauiDensity("medium"); // level 1
    useDesignHub.getState().setActiveSystem("fluent");
    useDesignHub.getState().setFluentSize("small");
    // current level (1) is inside small's fold-range -> unchanged at 1
    expect(useDesignHub.getState().globalDensity).toBe(1);
  });

  it("P2: switching DS does not flip a custom-LIGHT M3 theme to dark", () => {
    // Sit M3 on a custom LIGHT theme
    useDesignHub.setState({
      m3: { themeKey: "custom", density: 0, customColor: "#6750A4", isDarkCustom: false },
    });
    // Go dark elsewhere, then come back to M3
    useDesignHub.getState().setCarbonTheme("g100"); // dark
    expect(useDesignHub.getState().globalMode).toBe("dark");
    useDesignHub.getState().setActiveSystem("m3");
    // custom theme keeps its own light/dark — not flipped to dark
    expect(useDesignHub.getState().m3.themeKey).toBe("custom");
    expect(useDesignHub.getState().m3.isDarkCustom).toBe(false);
  });
});
