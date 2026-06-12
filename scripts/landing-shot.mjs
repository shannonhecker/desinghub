#!/usr/bin/env node
/* One-off landing screenshot helper for the motion-polish PR.
   Usage: node scripts/landing-shot.mjs <label> [--reduce]
   Saves full-page + fold shots to .usertest-shots/landing-polish/ in the
   MAIN checkout (shared with the owner), dark scheme (page is dark-only). */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const label = process.argv[2] ?? "shot";
const reduce = process.argv.includes("--reduce");
const OUT = "/Users/shannonhecker/Documents/Cursor/Design-Hub/.usertest-shots/landing-polish";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
  reducedMotion: reduce ? "reduce" : "no-preference",
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3199/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Fold shot (hero as painted on arrival)
await page.screenshot({ path: `${OUT}/${label}-fold${reduce ? "-reduce" : ""}.png` });

// Walk the page so every IO reveal fires, then full-page shot.
// NOTE: the page sets scroll-behavior: smooth, so scrollTo must force
// behavior: "instant" or the walk lags behind and reveals never fire.
await page.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y <= h; y += 600) {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 180));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
});
await page.waitForTimeout(1200);
await page.screenshot({
  path: `${OUT}/${label}-full${reduce ? "-reduce" : ""}.png`,
  fullPage: true,
});

if (errors.length) {
  console.error("PAGE ERRORS:", errors);
  process.exitCode = 1;
} else {
  console.log(`saved ${label} shots to ${OUT}`);
}
await browser.close();
