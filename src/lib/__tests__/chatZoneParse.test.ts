import { describe, it, expect } from "vitest";
import { parseZoneTarget } from "../chatZoneParse";

/* Pure zone-phrase parser used by ChatPanel's local command path so
   "add a card to the sidebar" lands in the sidebar instead of body. */
describe("parseZoneTarget", () => {
  it("parses 'to the header'", () => {
    expect(parseZoneTarget("add a search box to the header")).toBe("header");
  });

  it("parses 'in the sidebar'", () => {
    expect(parseZoneTarget("put a card in the sidebar")).toBe("sidebar");
  });

  it("parses 'into the footer'", () => {
    expect(parseZoneTarget("insert a badge into the footer")).toBe("footer");
  });

  it("parses 'on the body'", () => {
    expect(parseZoneTarget("show a table on the body")).toBe("body");
  });

  it("parses 'from the header' (removal phrasing)", () => {
    expect(parseZoneTarget("remove the buttons from the header")).toBe("header");
  });

  it("works without the article", () => {
    expect(parseZoneTarget("add a badge to footer")).toBe("footer");
  });

  it("is case-insensitive", () => {
    expect(parseZoneTarget("Add a card IN THE HEADER")).toBe("header");
  });

  /* "from" marks a SOURCE, never an add destination: when a sentence
     carries both, the non-"from" pair must win regardless of order. */
  it("prefers the destination over a 'from' source in the same sentence", () => {
    expect(parseZoneTarget("add the inputs from the sidebar into the body")).toBe("body");
  });

  it("prefers the destination even when the 'from' source comes last", () => {
    expect(parseZoneTarget("add a card into the body from the sidebar")).toBe("body");
  });

  it("still resolves a lone 'from' pair (removal phrasing)", () => {
    expect(parseZoneTarget("drop the badge from the footer")).toBe("footer");
  });

  it("returns null when no zone phrase is present", () => {
    expect(parseZoneTarget("add a data table")).toBeNull();
  });

  it("does not treat a bare zone word as a target ('add a header')", () => {
    expect(parseZoneTarget("add a header")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseZoneTarget("")).toBeNull();
  });
});
