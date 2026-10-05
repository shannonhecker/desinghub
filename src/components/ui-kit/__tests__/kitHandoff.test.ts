import { describe, it, expect, beforeEach } from "vitest";
import { useDesignHub } from "@/store/useDesignHub";
import { builderHrefFor, isDarkActive, toggleActiveMode, KIT_SYSTEMS } from "../kitHandoff";

const initial = useDesignHub.getState();
beforeEach(() => { useDesignHub.setState(initial, true); });

describe("kitHandoff", () => {
  it("toggles every system between its light and dark theme", () => {
    for (const id of KIT_SYSTEMS) {
      useDesignHub.getState().setActiveSystem(id);
      const before = isDarkActive(useDesignHub.getState());
      toggleActiveMode();
      expect(isDarkActive(useDesignHub.getState()), id).toBe(!before);
      expect(useDesignHub.getState().globalMode, id).toBe(before ? "light" : "dark");
      toggleActiveMode();
      expect(isDarkActive(useDesignHub.getState()), id).toBe(before);
    }
  });

  it("keeps the Salt palette family when the mode flips", () => {
    useDesignHub.getState().setActiveSystem("salt");
    useDesignHub.getState().setSaltTheme("legacy-dark");
    toggleActiveMode();
    expect(useDesignHub.getState().salt.themeKey).toBe("legacy-light");
  });

  it("keeps an M3 custom colour when the mode flips", () => {
    useDesignHub.getState().setActiveSystem("m3");
    useDesignHub.getState().setM3Theme("custom");
    useDesignHub.getState().setM3DarkCustom(true);
    toggleActiveMode();
    const s = useDesignHub.getState();
    expect(s.m3.themeKey).toBe("custom");
    expect(isDarkActive(s)).toBe(false);
  });

  it("carries system, mode, density and theme into the builder link", () => {
    const s = useDesignHub.getState();
    s.setActiveSystem("carbon");
    s.setCarbonTheme("white");
    s.setCarbonDensity("compact");
    const url = new URL(builderHrefFor(useDesignHub.getState()), "http://x");
    expect(url.pathname).toBe("/builder");
    expect(Object.fromEntries(url.searchParams)).toEqual({ ds: "carbon", mode: "light", density: "compact", themeKey: "white" });
  });

  it("carries the mode across a system switch", () => {
    const s = useDesignHub.getState();
    s.setActiveSystem("salt");
    if (isDarkActive(useDesignHub.getState())) toggleActiveMode();
    for (const id of KIT_SYSTEMS) {
      useDesignHub.getState().setActiveSystem(id);
      expect(isDarkActive(useDesignHub.getState()), id).toBe(false);
      expect(builderHrefFor(useDesignHub.getState())).toContain("mode=light");
    }
  });
});
