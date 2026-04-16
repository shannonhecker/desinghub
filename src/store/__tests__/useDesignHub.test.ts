import { describe, it, expect, beforeEach } from "vitest";
import { useDesignHub } from "../useDesignHub";

function resetStore() {
  useDesignHub.setState({
    activeSystem: "salt",
    salt: { themeKey: "jpm-light", density: "medium" },
    m3: { themeKey: "light", density: 0, customColor: "#6750A4", isDarkCustom: false },
    fluent: { themeKey: "light", size: "medium" },
    ausos: { themeKey: "light", density: "medium", accentColor: "#7E6BC4" },
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

  it("setAusosAccent rejects invalid hex", () => {
    useDesignHub.getState().setAusosAccent("invalid");
    expect(useDesignHub.getState().ausos.accentColor).toBe("#7E6BC4"); // unchanged
  });

  it("setAusosAccent accepts valid hex", () => {
    useDesignHub.getState().setAusosAccent("#3D8A82");
    expect(useDesignHub.getState().ausos.accentColor).toBe("#3D8A82");
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
});
