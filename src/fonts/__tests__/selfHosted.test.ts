// @vitest-environment node
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Fonts never depend on another host, at build or at run time.
 *
 * Two preview builds failed inside next/font's Google loader (a fetch at
 * build time), and the icon font and three documentation stylesheets asked
 * Google for fonts while the page ran. Every font now lives in src/fonts.
 */
const ROOT = resolve(__dirname, "../../..");
const FONTS = join(ROOT, "src/fonts");
const css = readFileSync(join(FONTS, "fonts.css"), "utf8");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" || name === "node_modules" ? [] : sources(path);
    return /\.(tsx?|jsx?|css)$/.test(name) ? [path] : [];
  });
}

describe("self-hosted fonts", () => {
  it("no source file loads a font through next/font/google", () => {
    const users = sources(join(ROOT, "src")).filter((f) => /from\s+["']next\/font\/google["']/.test(readFileSync(f, "utf8")));
    expect(users).toEqual([]);
  });

  it("the document and the design systems' own stylesheets ask no font host for anything", () => {
    const runtime = [
      "src/app/layout.tsx",
      "src/app/globals.css",
      "src/data/m3/m3-documentation.jsx",
      "src/data/fluent/fluent2-documentation.jsx",
      "src/data/uoaui/uoaui-documentation.jsx",
      "src/data/salt/salt-documentation.jsx",
      "src/data/carbon/carbon-documentation.jsx",
    ];
    for (const file of runtime) {
      const text = readFileSync(join(ROOT, file), "utf8");
      expect(text, file).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });

  it("every file the stylesheet names is in the repository", () => {
    const urls = [...css.matchAll(/url\("(\.\/[^"]+)"\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(50);
    for (const url of new Set(urls)) expect(existsSync(join(FONTS, url)), url).toBe(true);
  });

  it("every font file is named by the stylesheet, and sits beside its licence", () => {
    const families = readdirSync(FONTS).filter((n) => statSync(join(FONTS, n)).isDirectory() && n !== "__tests__");
    expect(families.length).toBe(10);
    for (const family of families) {
      const files = readdirSync(join(FONTS, family));
      const licence = files.find((n) => /^(OFL|LICENSE)\.txt$/.test(n));
      expect(licence, `${family} has its licence text`).toBeTruthy();
      expect(readFileSync(join(FONTS, family, licence!), "utf8")).toMatch(/SIL OPEN FONT LICENSE|Apache License/);
      for (const file of files.filter((n) => n.endsWith(".woff2"))) {
        expect(css, `${family}/${file} is used`).toContain(`"./${family}/${file}"`);
      }
    }
  });

  it("keeps the family names and the CSS variables the design systems ask for", () => {
    const vars: Record<string, string> = {
      "--font-outfit": "Outfit",
      "--font-dm-sans": "DM Sans",
      "--font-space-grotesk": "Space Grotesk",
      "--font-inter": "Inter",
      "--font-open-sans": "Open Sans",
      "--font-roboto": "Roboto",
      "--font-ibm-plex-sans": "IBM Plex Sans",
      "--font-ibm-plex-mono": "IBM Plex Mono",
      "--font-bricolage": "Bricolage Grotesque",
    };
    for (const [name, family] of Object.entries(vars)) {
      expect(css).toContain(`${name}: "${family}", "${family} Fallback";`);
      expect(css).toContain(`@font-face { font-family: "${family}"; font-style: normal;`);
      /* The metric-matched fallback that holds the text's place while the font loads. */
      expect(css).toMatch(new RegExp(`@font-face \\{ font-family: "${family} Fallback"; src: local\\("Arial"\\); ascent-override: [\\d.]+%; descent-override: [\\d.]+%; line-gap-override: [\\d.]+%; size-adjust: [\\d.]+%; \\}`));
    }
  });

  it("declares exactly the weights next/font declared: a new weight changes how existing text is drawn", () => {
    /* Inter 300 was added once and made uoaui's light text narrower in Edit
       than in Present (the builder had always drawn it at 400). */
    const weights = (family: string) => [...new Set([...css.matchAll(new RegExp(`font-family: "${family}"; font-style: normal; font-weight: (\\d+);`, "g"))].map((m) => m[1]))].sort();
    expect(weights("Inter")).toEqual(["400", "500", "600", "700"]);
    expect(weights("Outfit")).toEqual(["300", "400", "500", "600"]);
    expect(weights("DM Sans")).toEqual(["300", "400", "500", "600", "700"]);
    expect(weights("Space Grotesk")).toEqual(["300", "400", "500", "600", "700"]);
    expect(weights("Open Sans")).toEqual(["400", "600", "700"]);
    expect(weights("Roboto")).toEqual(["400", "500", "700"]);
    expect(weights("IBM Plex Sans")).toEqual(["300", "400", "500", "600", "700"]);
    expect(weights("IBM Plex Mono")).toEqual(["400", "500", "600"]);
    expect(weights("Bricolage Grotesque")).toEqual(["500", "700", "800"]);
  });

  it("Inter 300 exists for the library's uoaui pages only, never for the builder", () => {
    const light = readFileSync(join(FONTS, "libraryInter300.ts"), "utf8");
    expect(light).toContain("font-weight: 300");
    expect([...light.matchAll(/new URL\("\.\/inter\/(inter-[a-z-]+\.woff2)"/g)].length).toBe(7);
    /* The site-wide stylesheet, which the builder loads, declares none. */
    expect(css).not.toMatch(/font-family: "Inter"; font-style: normal; font-weight: 300/);
    const users = sources(join(ROOT, "src")).filter((f) => /libraryInter300/.test(readFileSync(f, "utf8"))).map((f) => f.slice(ROOT.length + 1));
    expect(users).toEqual(["src/components/DesignHubApp.tsx"]);
    const app = readFileSync(join(ROOT, "src/components/DesignHubApp.tsx"), "utf8");
    expect(app).toMatch(/activeSystem === "uoaui" \? <style id="library-inter-300"/);
    expect(sources(join(ROOT, "src/components/builder")).some((f) => /DesignHubApp/.test(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")) && /from ["']@\/components\/DesignHubApp["']/.test(readFileSync(f, "utf8")))).toBe(false);
  });

  it("the icon font blocks rather than swapping an icon's name in as a word", () => {
    const face = css.slice(css.indexOf('font-family: "Material Symbols Outlined";'));
    expect(face.slice(0, face.indexOf("}"))).toContain("font-display: block");
  });
});
