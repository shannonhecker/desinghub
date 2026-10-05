/* The builder's subtle-text token (--b-fg3) carries small text: hints,
   counts, dates, the save line. It must clear WCAG AA (4.5:1) on the chrome
   grounds it sits on, in both modes (5 Oct, light-mode audit). Reads the
   token values from builder.css so a future retune cannot slip under. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src", "components", "builder", "builder.css"), "utf8");

function token(scope: string, name: string): string {
  const block = css.slice(css.indexOf(scope));
  const m = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`${name} not found under ${scope}`);
  return m[1].trim();
}
function rgba(v: string): [number, number, number, number] {
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16), 1];
  const m = v.match(/rgba?\(([^)]+)\)/)!;
  const p = m[1].split(",").map(Number);
  return [p[0], p[1], p[2], p[3] ?? 1];
}
const over = (fg: number[], bg: number[]) => fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3]));
const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a: number[], b: number[]) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };

describe("--b-fg3 (subtle text) clears 4.5:1 on the chrome grounds", () => {
  const cases: Array<[string, string, string[]]> = [
    ["dark", ".builder-shell.builder-shell {", ["--b-bg", "--b-bg2", "--b-bg3"]],
    ["light", ".builder-shell.builder-shell.builder-light {", ["--b-bg", "--b-bg2", "--b-bg3"]],
  ];
  for (const [mode, scope, grounds] of cases) {
    it(`${mode}: on every shell ground`, () => {
      const fg = rgba(token(scope, "--b-fg3"));
      for (const g of grounds) {
        const bg = rgba(token(scope, g));
        const r = ratio(over(fg, bg), bg);
        expect(r, `${mode} --b-fg3 on ${g} (${token(scope, g)}): ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
  it("light: on a white raised surface too", () => {
    const fg = rgba(token(".builder-shell.builder-shell.builder-light {", "--b-fg3"));
    const bg = [255, 255, 255, 1];
    expect(ratio(over(fg, bg), bg)).toBeGreaterThanOrEqual(4.5);
  });
});
