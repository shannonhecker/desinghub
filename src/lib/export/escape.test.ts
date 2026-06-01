import { describe, it, expect } from "vitest";
import { jsxText, jsxAttr, htmlText, htmlAttr } from "./escape";

describe("jsxText (JSX children)", () => {
  it("leaves plain text byte-identical", () => {
    expect(jsxText("Buy now")).toBe("Buy now");
    expect(jsxText("Heading 1")).toBe("Heading 1");
  });

  it("leaves a bare quote untouched (safe in JSX children)", () => {
    // `"` is fine inside JSX children text — only < > { } & are unsafe.
    expect(jsxText('Say "hi"')).toBe('Say "hi"');
  });

  it("wraps `<`/`>` in an expression form", () => {
    expect(jsxText("a < b")).toBe(`{${JSON.stringify("a < b")}}`);
    expect(jsxText("<c>")).toBe(`{${JSON.stringify("<c>")}}`);
  });

  it("wraps `{`/`}` in an expression form", () => {
    expect(jsxText("{json}")).toBe(`{${JSON.stringify("{json}")}}`);
    expect(jsxText("a}b")).toBe(`{${JSON.stringify("a}b")}}`);
  });

  it("wraps `&` in an expression form (both exporters)", () => {
    expect(jsxText("A & B")).toBe(`{${JSON.stringify("A & B")}}`);
  });

  it("neutralizes a <script> payload in children", () => {
    const out = jsxText("<script>alert(1)</script>");
    // Wrapped as a JS string expression: the `<script>` is inert text inside a
    // string literal, NOT a children-position tag. Always-valid JSX.
    expect(out).toBe(`{${JSON.stringify("<script>alert(1)</script>")}}`);
    // The dangerous payload is not in a bare/raw children position — it is
    // fully enclosed in the `{"..."}` expression wrapper.
    expect(out.startsWith('{"')).toBe(true);
    expect(out.endsWith('"}')).toBe(true);
  });

  it("uses fallback for null/undefined", () => {
    expect(jsxText(null, "Heading")).toBe("Heading");
    expect(jsxText(undefined, "Heading")).toBe("Heading");
    expect(jsxText(null)).toBe("");
  });

  it("coerces non-strings", () => {
    expect(jsxText(42)).toBe("42");
  });
});

describe("jsxAttr (inside a double-quoted JSX attribute)", () => {
  it("leaves plain text byte-identical", () => {
    expect(jsxAttr("Search...")).toBe("Search...");
    expect(jsxAttr("Label")).toBe("Label");
  });

  it("entity-escapes a double quote so it cannot close the attribute", () => {
    expect(jsxAttr('a"b')).toBe("a&quot;b");
  });

  it("entity-escapes `&`, `<`, `>`", () => {
    expect(jsxAttr("A & B")).toBe("A &amp; B");
    expect(jsxAttr("a<b>c")).toBe("a&lt;b&gt;c");
  });

  it("escapes `&` before other entities (no double-encoding artifacts)", () => {
    expect(jsxAttr('&"')).toBe("&amp;&quot;");
  });

  it("neutralizes a <script> payload in an attribute", () => {
    const out = jsxAttr('"><script>x</script>');
    expect(out).toBe("&quot;&gt;&lt;script&gt;x&lt;/script&gt;");
    expect(out).not.toContain('"');
    expect(out).not.toContain("<");
  });

  it("uses fallback for null/undefined", () => {
    expect(jsxAttr(null, "Select an option")).toBe("Select an option");
    expect(jsxAttr(undefined)).toBe("");
  });
});

describe("htmlText (HTML children)", () => {
  it("leaves plain text byte-identical", () => {
    expect(htmlText("Button")).toBe("Button");
  });

  it("leaves a bare quote untouched (safe in HTML text)", () => {
    expect(htmlText('Say "hi"')).toBe('Say "hi"');
  });

  it("escapes `& < >`", () => {
    expect(htmlText("A & B")).toBe("A &amp; B");
    expect(htmlText("a<b>c")).toBe("a&lt;b&gt;c");
  });

  it("neutralizes a <script> payload in children", () => {
    const out = htmlText("<script>alert(1)</script>");
    expect(out).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(out).not.toContain("<script>");
  });

  it("uses fallback for null/undefined", () => {
    expect(htmlText(null, "Heading")).toBe("Heading");
    expect(htmlText(undefined)).toBe("");
  });
});

describe("htmlAttr (HTML attribute value)", () => {
  it("leaves plain text byte-identical", () => {
    expect(htmlAttr("Search...")).toBe("Search...");
  });

  it("escapes `& < > \"`", () => {
    expect(htmlAttr('a"b')).toBe("a&quot;b");
    expect(htmlAttr("A & B")).toBe("A &amp; B");
    expect(htmlAttr("a<b>c")).toBe("a&lt;b&gt;c");
  });

  it("escapes `&` first", () => {
    expect(htmlAttr('&"')).toBe("&amp;&quot;");
  });

  it("neutralizes a <script> payload in an attribute", () => {
    const out = htmlAttr('"><script>x</script>');
    expect(out).toBe("&quot;&gt;&lt;script&gt;x&lt;/script&gt;");
    expect(out).not.toContain('"');
    expect(out).not.toContain("<");
  });

  it("uses fallback for null/undefined", () => {
    expect(htmlAttr(null, "fallback")).toBe("fallback");
    expect(htmlAttr(undefined)).toBe("");
  });
});
