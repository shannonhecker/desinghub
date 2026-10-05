#!/usr/bin/env node
/**
 * Makes the share image and the .ico favicon from the site's own material:
 *
 *   src/app/opengraph-image.png, src/app/twitter-image.png   1200 x 630
 *   public/favicon.ico                                       16, 32 and 48 px
 *
 * The share image is the site's mark and headline beside a real capture of
 * the builder: the Performance Analytics template in Present, taken from the
 * running site by this script. Nothing is drawn by hand or generated.
 *
 *   npm run build && npx next start -p 3261
 *   node scripts/make-share-assets.mjs [--base http://localhost:3261]
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3261");
const dataUri = (path, type) => `data:${type};base64,${readFileSync(join(ROOT, path)).toString("base64")}`;

const browser = await chromium.launch();

/* 1. The product capture. */
const product = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, colorScheme: "dark", reducedMotion: "reduce" });
await product.goto(`${BASE}/builder`);
await product.getByRole("textbox", { name: "Chat message input" }).waitFor();
await product.getByRole("button", { name: /Browse templates/ }).click();
await product.getByRole("button", { name: "Use the Performance Analytics template" }).click();
await product.locator(".present-stage .bp-main [data-block-id]").first().waitFor();
await product.locator(".present-stage .highcharts-container").first().waitFor();
await product.evaluate(() => document.fonts.ready);
await product.waitForTimeout(1500);
/* The report itself, without the stage's margin: the outermost box around
   the canvas that is still narrower than the stage. */
const clip = await product.evaluate(() => {
  const stage = document.querySelector(".present-stage");
  let el = document.querySelector(".present-stage .bp-main");
  while (el.parentElement && el.parentElement !== stage && el.parentElement.getBoundingClientRect().width < stage.getBoundingClientRect().width - 8) el = el.parentElement;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, window.innerHeight - r.y) };
});
const capture = await product.screenshot({ type: "png", clip });
await product.close();

/* 2. The share image. */
const fonts = `
@font-face { font-family: "Bricolage Grotesque"; font-weight: 500 800; src: url(${dataUri("src/fonts/bricolage-grotesque/bricolage-grotesque-latin.woff2", "font/woff2")}) format("woff2"); }
@font-face { font-family: "Inter"; font-weight: 400 700; src: url(${dataUri("src/fonts/inter/inter-latin.woff2", "font/woff2")}) format("woff2"); }`;
const mark = readFileSync(join(ROOT, "public/aologo.svg"), "utf8").replace(/width="\d+" height="\d+"/, 'width="74" height="45"');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { background: #0A0E1A; color: #F4F6FB; font-family: "Inter", sans-serif; position: relative; }
.glow { position: absolute; inset: 0; background: radial-gradient(900px 520px at 88% 8%, rgba(167,139,250,0.20), transparent 62%), radial-gradient(700px 480px at 4% 104%, rgba(94,231,223,0.10), transparent 60%); }
.copy { position: absolute; left: 60px; top: 60px; width: 540px; }
.brand { display: flex; align-items: center; gap: 16px; font: 600 26px/1 "Inter", sans-serif; letter-spacing: -0.01em; }
h1 { margin-top: 96px; font: 700 50px/1.08 "Bricolage Grotesque", sans-serif; letter-spacing: -0.03em; }
h1 span { display: block; white-space: nowrap; }
h1 span + span { color: #A78BFA; }
p { margin-top: 24px; font: 400 22px/1.45 "Inter", sans-serif; color: #B6BED3; max-width: 430px; }
.systems { position: absolute; left: 60px; bottom: 56px; display: flex; flex-wrap: wrap; gap: 10px; width: 540px; }
.systems span { font: 500 16px/1 "Inter", sans-serif; color: #D7DCEA; padding: 9px 13px; border: 1px solid rgba(255,255,255,0.16); border-radius: 999px; background: rgba(255,255,255,0.04); }
.shot { position: absolute; left: 620px; top: 70px; width: 900px; border-radius: 16px 0 0 0; overflow: hidden; border: 1px solid rgba(255,255,255,0.14); border-right: 0; box-shadow: 0 30px 80px rgba(0,0,0,0.55); background: #0b1020; }
.shot img { display: block; width: 100%; }
</style></head><body>
<div class="glow"></div>
<div class="copy">
  <div class="brand">${mark}<span>uoaui.ai</span></div>
  <h1><span>One finance screen.</span><span>Five design systems.</span></h1>
  <p>Describe the screen. Switch the system. Export code that runs.</p>
</div>
<div class="systems"><span>Salt DS</span><span>Material 3</span><span>Fluent 2</span><span>Carbon</span><span>uoaui DS</span></div>
<div class="shot"><img src="data:image/png;base64,${capture.toString("base64")}" alt=""></div>
</body></html>`;
const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await card.setContent(html, { waitUntil: "load" });
await card.evaluate(() => document.fonts.ready);
await card.waitForTimeout(300);
const og = join(ROOT, "src/app/opengraph-image.png");
await card.screenshot({ path: og, type: "png" });
copyFileSync(og, join(ROOT, "src/app/twitter-image.png"));
await card.close();

/* 3. favicon.ico: the SVG favicon at the three sizes a tab, a bookmark and a
      shortcut ask for, as PNG entries in one ICO file. */
const svg = readFileSync(join(ROOT, "public/favicon.svg"), "utf8");
const icon = await browser.newPage({ deviceScaleFactor: 1 });
const sizes = [16, 32, 48];
const pngs = [];
for (const size of sizes) {
  await icon.setViewportSize({ width: size, height: size });
  await icon.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  pngs.push(await icon.screenshot({ type: "png", omitBackground: true }));
}
await icon.close();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
const entries = [];
let offset = 6 + 16 * sizes.length;
sizes.forEach((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0); e.writeUInt8(size, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  entries.push(e);
});
writeFileSync(join(ROOT, "public/favicon.ico"), Buffer.concat([header, ...entries, ...pngs]));

await browser.close();
console.log("wrote src/app/opengraph-image.png, src/app/twitter-image.png, public/favicon.ico");
