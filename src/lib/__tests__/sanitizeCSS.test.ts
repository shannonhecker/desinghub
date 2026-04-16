import { describe, it, expect } from "vitest";
import { sanitizeCSS, isValidHex } from "../sanitizeCSS";

describe("sanitizeCSS", () => {
  it("passes through normal CSS unchanged", () => {
    const css = "body { color: red; background: #fff; }";
    expect(sanitizeCSS(css)).toBe(css);
  });

  it("strips HTML tags that could escape a style element", () => {
    const css = "body { color: red; }</style><script>alert(1)</script><style>";
    const result = sanitizeCSS(css);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</style>");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("strips expression() injection", () => {
    expect(sanitizeCSS("width: expression(alert(1))")).not.toContain("expression");
  });

  it("strips javascript: protocol", () => {
    expect(sanitizeCSS("background: url(javascript:alert(1))")).not.toContain("javascript");
  });

  it("strips @import", () => {
    expect(sanitizeCSS("@import url('evil.css');")).not.toContain("@import");
  });

  it("strips url() with http scheme but keeps data: URLs", () => {
    const withHttp = sanitizeCSS("background: url(http://evil.com/bg.png)");
    expect(withHttp).toContain("url()");
    // data: URLs should be preserved (they're inline)
    const withData = "background: url(data:image/png;base64,abc)";
    expect(sanitizeCSS(withData)).toContain("data:image/png");
  });

  it("strips -moz-binding", () => {
    expect(sanitizeCSS("-moz-binding: url(evil.xml)")).not.toContain("-moz-binding");
  });

  it("handles empty string", () => {
    expect(sanitizeCSS("")).toBe("");
  });
});

describe("isValidHex", () => {
  it("accepts valid 6-digit hex", () => {
    expect(isValidHex("#1B7F9E")).toBe(true);
    expect(isValidHex("#ffffff")).toBe(true);
    expect(isValidHex("#000000")).toBe(true);
    expect(isValidHex("#6750A4")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidHex("#fff")).toBe(false);        // 3-digit
    expect(isValidHex("1B7F9E")).toBe(false);      // no hash
    expect(isValidHex("#1B7F9E00")).toBe(false);   // 8-digit
    expect(isValidHex("#GGGGGG")).toBe(false);      // invalid chars
    expect(isValidHex("red")).toBe(false);
    expect(isValidHex("")).toBe(false);
    expect(isValidHex("#12345")).toBe(false);       // 5-digit
  });
});
