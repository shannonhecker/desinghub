import { describe, it, expect } from "vitest";
import { parseThemeCommand, describeThemeCommand } from "../themeCommand";

describe("parseThemeCommand", () => {
  it("reads a design system and a mode from one message", () => {
    const cmd = parseThemeCommand("switch to Carbon in light mode");
    expect(cmd).toEqual({ designSystem: "carbon", mode: "light", pure: true });
    expect(describeThemeCommand(cmd)).toBe("Switched to Carbon DS in light mode.");
  });

  it("knows all five design systems", () => {
    expect(parseThemeCommand("try Fluent").designSystem).toBe("fluent");
    expect(parseThemeCommand("use Material 3").designSystem).toBe("m3");
    expect(parseThemeCommand("m3 please").designSystem).toBe("m3");
    expect(parseThemeCommand("Salt DS").designSystem).toBe("salt");
    expect(parseThemeCommand("uoaui").designSystem).toBe("uoaui");
    expect(parseThemeCommand("go carbon").designSystem).toBe("carbon");
  });

  it("reads a mode on its own", () => {
    expect(parseThemeCommand("dark mode")).toEqual({ mode: "dark", pure: true });
    expect(describeThemeCommand(parseThemeCommand("make it light"))).toBe("Switched to light mode.");
  });

  /* Whole words only: these used to be hijacked as mode switches. */
  it("does not mistake part of a word for a switch", () => {
    expect(parseThemeCommand("add a lightweight table")).toEqual({ pure: false });
    expect(parseThemeCommand("highlight the totals row")).toEqual({ pure: false });
    expect(parseThemeCommand("add a darker header")).toEqual({ pure: false });
  });

  it("is not pure when the message asks for something else as well", () => {
    const cmd = parseThemeCommand("add a column chart with dark blue bars");
    expect(cmd.mode).toBe("dark");
    expect(cmd.pure).toBe(false);
    expect(parseThemeCommand("build a risk dashboard in Carbon").pure).toBe(false);
  });

  it("an ordinary message is not a switch at all", () => {
    expect(parseThemeCommand("add a data table of VaR by fund")).toEqual({ pure: false });
    expect(describeThemeCommand(parseThemeCommand("hello"))).toBe("");
  });
});
