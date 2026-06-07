#!/usr/bin/env node
/**
 * verify-carbon-theme — SCRATCH repro/verification for the Carbon dark-mode
 * theme bug. Loads a given carbon-scoped.css into a headless page, renders the
 * exact CarbonReal wrapper markup (`<div class="carbon-live-scope cds--{white|g100}">`)
 * with a real Carbon button inside, and reports the COMPUTED --cds-background +
 * background-color for each mode. Pass/fail:
 *   light wrapper -> white-ish bg ; dark wrapper -> dark bg.
 *
 * Usage: node scripts/verify-carbon-theme.mjs [path-to-carbon-scoped.css]
 *   default: public/carbon-scoped.css
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const cssPath = process.argv[2] ? resolve(process.argv[2]) : resolve(repoRoot, "public", "carbon-scoped.css");

function isDark(rgb) {
  // crude luminance check on an "rgb(r, g, b)" string
  const m = rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

async function main() {
  const css = await readFile(cssPath, "utf8");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><html><head></head>
     <body style="margin:0;background:#333">
       <div id="light" class="carbon-live-scope cds--white">
         <button class="cds--btn cds--btn--primary" type="button">Light</button>
       </div>
       <div id="dark" class="carbon-live-scope cds--g100">
         <button class="cds--btn cds--btn--primary" type="button">Dark</button>
       </div>
     </body></html>`,
    { waitUntil: "domcontentloaded" }
  );
  await page.addStyleTag({ content: css });

  const read = async (sel) =>
    page.$eval(sel, (el) => {
      const cs = getComputedStyle(el);
      return {
        cdsBackground: cs.getPropertyValue("--cds-background").trim() || "(unset)",
        backgroundColor: cs.backgroundColor,
        color: cs.color,
      };
    });
  const readBtn = async (sel) =>
    page.$eval(sel, (el) => {
      const cs = getComputedStyle(el);
      return { backgroundColor: cs.backgroundColor, color: cs.color };
    });

  const light = await read("#light");
  const dark = await read("#dark");
  const lightBtn = await readBtn("#light .cds--btn");
  const darkBtn = await readBtn("#dark .cds--btn");
  await browser.close();

  console.log(`\nCSS under test: ${cssPath}\n`);
  console.log("LIGHT wrapper (.carbon-live-scope.cds--white):", light);
  console.log("  button:", lightBtn);
  console.log("DARK  wrapper (.carbon-live-scope.cds--g100):", dark);
  console.log("  button:", darkBtn);

  const lightOk = isDark(light.backgroundColor) === false;
  const darkOk = isDark(dark.backgroundColor) === true;
  console.log("\nRESULT:");
  console.log(`  light wrapper is light bg: ${lightOk ? "PASS" : "FAIL"} (${light.backgroundColor})`);
  console.log(`  dark  wrapper is dark  bg: ${darkOk ? "PASS" : "FAIL"} (${dark.backgroundColor})`);
  console.log(`  >>> ${lightOk && darkOk ? "THEME SWITCH WORKS" : "THEME SWITCH BROKEN"}\n`);
  process.exit(lightOk && darkOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
