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
    selectedComponent: null,
    searchQuery: "",
    activeTab: "preview",
    sidebarOpen: true,
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
    expect(useDesignHub.getState().sidebarOpen).toBe(true);
    useDesignHub.getState().toggleSidebar();
    expect(useDesignHub.getState().sidebarOpen).toBe(false);
    useDesignHub.getState().toggleSidebar();
    expect(useDesignHub.getState().sidebarOpen).toBe(true);
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
});
