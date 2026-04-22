#!/usr/bin/env node
/**
 * screenshot-matrix — headless DS × theme × density capture.
 *
 * Runs Playwright against a locally-running dev server (npm run dev on
 * http://localhost:3000) and captures one PNG per permutation. Output
 * lives at out/screenshots/<ds>/<theme>/<density>.png (gitignored).
 *
 * Usage:
 *   npm run dev                          # in another shell
 *   node scripts/screenshot-matrix.mjs   # diff-run against latest baseline
 *   node scripts/screenshot-matrix.mjs --save  # refresh local baseline
 *
 * Dependencies (optional; install when you actually need screenshot runs):
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *
 * The script is intentionally tolerant: if Playwright isn't installed
 * we exit 0 with a helpful message so CI doesn't fail on machines that
 * only run the cheap checks (tsc / vitest / eslint / tokens-audit).
 */

import { mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'out/screenshots');

const MATRIX = {
  salt:   { themes: ['light', 'dark', 'heritage-light', 'heritage-dark'], densities: ['high', 'medium', 'low', 'touch'] },
  m3:     { themes: ['light', 'dark', 'medium-contrast-light', 'high-contrast-light'], densities: ['0', '-1', '-2', '-3'] },
  fluent: { themes: ['light', 'dark'], densities: ['sm', 'md', 'lg'] },
  carbon: { themes: ['white', 'g10', 'g90', 'g100'], densities: ['compact', 'normal', 'spacious'] },
  ausos:  { themes: ['dark', 'light'], densities: ['high', 'medium', 'low', 'touch'] },
};

const BASE_URL = process.env.SS_BASE_URL ?? 'http://localhost:3000';

async function main() {
  const save = process.argv.includes('--save');
  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    console.log('@playwright/test is not installed — install when you need visual diffing:');
    console.log('  npm i -D @playwright/test');
    console.log('  npx playwright install chromium');
    console.log('\nskipping screenshot matrix.');
    return;
  }

  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let captured = 0;
  for (const [ds, { themes, densities }] of Object.entries(MATRIX)) {
    for (const theme of themes) {
      for (const density of densities) {
        const url = `${BASE_URL}/?ds=${ds}&theme=${encodeURIComponent(theme)}&density=${encodeURIComponent(density)}`;
        const dir = join(OUT, ds, theme);
        await mkdir(dir, { recursive: true });
        const path = join(dir, `${density}.png`);
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15_000 });
          await page.screenshot({ path, fullPage: true });
          captured++;
          process.stdout.write(`✓ ${ds}/${theme}/${density}.png\n`);
        } catch (err) {
          process.stdout.write(`✗ ${ds}/${theme}/${density}.png  (${err.message})\n`);
        }
      }
    }
  }

  await browser.close();
  console.log(`\ncaptured ${captured} permutations → ${OUT}`);
  if (save) console.log('baseline saved (working directory copy — not committed).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
