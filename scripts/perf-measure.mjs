#!/usr/bin/env node
/**
 * Slow-phone page measurements against a running production server.
 *
 *   npm run build && npx next start -p 3261
 *   node scripts/perf-measure.mjs [--base http://localhost:3261] [--runs 3] [--out file.json] [--ai on|off]
 *
 * Profile (the same every run, so before and after compare):
 *   390x844 at 3x, touch, 4x CPU slowdown, 1.6 Mbit/s down, 750 kbit/s up,
 *   150 ms round trip, empty cache.
 *
 * Per route it reports the median of the runs: transferred bytes by kind
 * (script, font, stylesheet, image, other), the number of font files, hosts
 * other than the site's own, first and largest contentful paint and the
 * cumulative layout shift up to 6 s after load.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3261");
const RUNS = Number(arg("runs", "3"));
const OUT = arg("out", "");
/* --ai on|off answers the builder's "is AI configured?" question for it, so a
   machine without a model key can measure the page as production draws it. */
const AI = arg("ai", "");
const ROUTES = [
  { name: "landing", path: "/" },
  { name: "library", path: "/ui-kit" },
  { name: "library entry", path: "/ui-kit?ds=salt&c=buttons" },
  { name: "builder", path: "/builder" },
];

const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function measure(browser, route) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const types = new Map();
  const urls = new Map();
  const bytes = { script: 0, font: 0, stylesheet: 0, image: 0, other: 0 };
  const fontFiles = new Set();
  const hosts = new Set();
  cdp.on("Network.responseReceived", (e) => {
    types.set(e.requestId, e.type);
    urls.set(e.requestId, e.response.url);
  });
  cdp.on("Network.loadingFinished", (e) => {
    const type = types.get(e.requestId);
    const url = urls.get(e.requestId) ?? "";
    if (!url.startsWith("http")) return;
    const kind = type === "Script" ? "script" : type === "Font" ? "font" : type === "Stylesheet" ? "stylesheet" : type === "Image" ? "image" : "other";
    bytes[kind] += e.encodedDataLength;
    if (kind === "font") fontFiles.add(url);
    const host = new URL(url).host;
    if (host !== new URL(BASE).host) hosts.add(host);
  });

  if (AI) await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: AI === "on", firebaseConfigured: false } }));
  await page.addInitScript(() => {
    window.__perf = { cls: 0, lcp: 0, fcp: 0, shifts: [] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__perf.cls += e.value;
        window.__perf.shifts.push({
          value: Math.round(e.value * 10000) / 10000,
          at: Math.round(e.startTime),
          nodes: (e.sources ?? []).map((s) => {
            const n = s.node;
            if (!n || n.nodeType !== 1) return "(text)";
            return `${n.tagName.toLowerCase()}${n.id ? "#" + n.id : ""}${typeof n.className === "string" && n.className ? "." + n.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
          }).slice(0, 3),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.name === "first-contentful-paint") window.__perf.fcp = e.startTime;
    }).observe({ type: "paint", buffered: true });
  });

  await page.goto(BASE + route.path, { waitUntil: "load", timeout: 180_000 });
  await page.waitForLoadState("networkidle", { timeout: 180_000 }).catch(() => {});
  await page.waitForTimeout(6000);
  const perf = await page.evaluate(() => window.__perf);
  await context.close();
  return { bytes, fontFiles: fontFiles.size, hosts: [...hosts].sort(), ...perf };
}

const browser = await chromium.launch();
const result = {};
for (const route of ROUTES) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await measure(browser, route));
  const pick = (f) => median(runs.map(f));
  const worst = runs.reduce((a, b) => (b.cls > a.cls ? b : a));
  result[route.name] = {
    path: route.path,
    scriptKB: Math.round(pick((r) => r.bytes.script) / 1024),
    fontKB: Math.round(pick((r) => r.bytes.font) / 1024),
    fontFiles: pick((r) => r.fontFiles),
    cssKB: Math.round(pick((r) => r.bytes.stylesheet) / 1024),
    imageKB: Math.round(pick((r) => r.bytes.image) / 1024),
    otherKB: Math.round(pick((r) => r.bytes.other) / 1024),
    fcpMs: Math.round(pick((r) => r.fcp)),
    lcpMs: Math.round(pick((r) => r.lcp)),
    cls: Math.round(pick((r) => r.cls) * 10000) / 10000,
    clsWorst: Math.round(worst.cls * 10000) / 10000,
    otherHosts: [...new Set(runs.flatMap((r) => r.hosts))],
    worstShifts: worst.shifts.sort((a, b) => b.value - a.value).slice(0, 4),
  };
  console.log(route.name, JSON.stringify(result[route.name]));
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 2));
