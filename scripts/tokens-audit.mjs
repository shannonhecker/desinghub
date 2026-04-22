#!/usr/bin/env node
/**
 * tokens-audit — literal-token scanner for Design Hub.
 *
 * Greps src/data/** for forbidden raw values (hex / rgba / px / ms) that
 * should have been tokenised. Emits a per-DS count and diffs against a
 * committed baseline (scripts/tokens-baseline.json).
 *
 * Usage:
 *   node scripts/tokens-audit.mjs              # report + exit 1 if count rose
 *   node scripts/tokens-audit.mjs --write      # refresh baseline
 *   node scripts/tokens-audit.mjs --json       # machine-readable output
 *
 * Why a standalone grep when ESLint has a rule for the same thing?
 * ESLint's AST cannot see literals that live inside template-literal
 * interpolations (common in each DS's buildCSS function). This script
 * works on the raw text and catches both.
 *
 * Allowlist:
 *   - MATERIAL_COLORS (reference swatches for dynamic theming)
 *   - *_DENSITY_MAP / *_SIZE_MAP (these ARE tokens, expressed as px)
 *   - code-snippets.ts (teaching material — must show raw values)
 *   - Files matching **\/code-snippets.ts are skipped entirely
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src/data');
const BASELINE = join(ROOT, 'scripts/tokens-baseline.json');

const DESIGN_SYSTEMS = ['salt', 'm3', 'fluent', 'carbon', 'ausos'];

const PATTERNS = {
  hex: /#[0-9a-fA-F]{3,8}\b/g,
  rgba: /rgba?\(\s*\d/g,
  px: /\b\d+(?:\.\d+)?px\b/g,
  ms: /\b\d+ms\b/g,
};

const ALLOWLIST_VARIABLE_NAMES = [
  'MATERIAL_COLORS',
  'SALT_DENSITY_MAP',
  'M3_DENSITY_MAP',
  'FLUENT_SIZE_MAP',
  'CARBON_DENSITY_MAP',
  'AUSOS_DENSITY_MAP',
  'DENSITY_MAP',
  'SIZE_MAP',
];

const ALLOWLIST_FILENAMES = [
  'code-snippets.ts',
];

/** Recursively collect .ts / .tsx / .jsx files under dir. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.(ts|tsx|jsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Resolve which DS a file belongs to (from its path). null = cross-cutting. */
function dsOf(path) {
  for (const ds of DESIGN_SYSTEMS) {
    if (path.includes(`/data/${ds}/`)) return ds;
  }
  return null;
}

/**
 * Strip regions we never lint:
 *   - Entire file if filename matches ALLOWLIST_FILENAMES
 *   - Balanced-brace blocks for any ALLOWLIST_VARIABLE_NAMES assignment
 *   - `// tokens-audit-ignore` single-line suppression
 *   - `// tokens-audit-ignore-next-line` and `// tokens-audit-ignore-block` / `// tokens-audit-ignore-end`
 */
function stripAllowed(source, path) {
  for (const name of ALLOWLIST_FILENAMES) {
    if (path.endsWith(name)) return '';
  }
  let out = source;
  for (const varName of ALLOWLIST_VARIABLE_NAMES) {
    const re = new RegExp(`\\b(?:const|let|var)\\s+${varName}\\s*(?::[^=]+)?=\\s*`, 'g');
    let match;
    while ((match = re.exec(out)) !== null) {
      const start = match.index;
      const openIdx = out.indexOf('{', start);
      const openArr = out.indexOf('[', start);
      const open = openArr !== -1 && (openIdx === -1 || openArr < openIdx) ? openArr : openIdx;
      if (open === -1) continue;
      const openCh = out[open];
      const closeCh = openCh === '{' ? '}' : ']';
      let depth = 0;
      let end = -1;
      for (let i = open; i < out.length; i++) {
        if (out[i] === openCh) depth++;
        else if (out[i] === closeCh) {
          depth--;
          if (depth === 0) { end = i; break; }
        }
      }
      if (end === -1) continue;
      out = out.slice(0, start) + ' '.repeat(end - start + 1) + out.slice(end + 1);
      re.lastIndex = end + 1;
    }
  }
  // Strip tokens-audit-ignore regions
  out = out.replace(/\/\/\s*tokens-audit-ignore-block[\s\S]*?\/\/\s*tokens-audit-ignore-end/g, '');
  // Strip lines marked with trailing `// tokens-audit-ignore`
  out = out
    .split('\n')
    .map((line) => (/\/\/\s*tokens-audit-ignore\b/.test(line) ? '' : line))
    .join('\n');
  return out;
}

async function auditFile(path) {
  const raw = await readFile(path, 'utf8');
  const stripped = stripAllowed(raw, path);
  const counts = { hex: 0, rgba: 0, px: 0, ms: 0 };
  const samples = { hex: [], rgba: [], px: [], ms: [] };
  for (const [kind, re] of Object.entries(PATTERNS)) {
    const matches = stripped.match(re);
    if (matches) {
      counts[kind] = matches.length;
      samples[kind] = [...new Set(matches)].slice(0, 5);
    }
  }
  return { path, counts, samples };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const write = args.has('--write');
  const json = args.has('--json');

  const files = await walk(SRC);
  const perDs = Object.fromEntries(DESIGN_SYSTEMS.map((d) => [d, { hex: 0, rgba: 0, px: 0, ms: 0, files: 0 }]));
  const other = { hex: 0, rgba: 0, px: 0, ms: 0, files: 0 };
  const perFile = [];

  for (const file of files) {
    const result = await auditFile(file);
    const total = result.counts.hex + result.counts.rgba + result.counts.px + result.counts.ms;
    if (total === 0) continue;
    const ds = dsOf(file);
    const bucket = ds ? perDs[ds] : other;
    bucket.hex += result.counts.hex;
    bucket.rgba += result.counts.rgba;
    bucket.px += result.counts.px;
    bucket.ms += result.counts.ms;
    bucket.files += 1;
    perFile.push({
      path: relative(ROOT, file),
      ds: ds ?? 'shared',
      ...result.counts,
      samples: result.samples,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    perDs,
    other,
    totals: {
      hex: Object.values(perDs).reduce((a, b) => a + b.hex, other.hex),
      rgba: Object.values(perDs).reduce((a, b) => a + b.rgba, other.rgba),
      px: Object.values(perDs).reduce((a, b) => a + b.px, other.px),
      ms: Object.values(perDs).reduce((a, b) => a + b.ms, other.ms),
    },
    files: perFile.sort((a, b) => (b.hex + b.rgba + b.px + b.ms) - (a.hex + a.rgba + a.px + a.ms)),
  };

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    const fmt = (ds, b) =>
      `  ${ds.padEnd(8)}  hex ${String(b.hex).padStart(3)}  rgba ${String(b.rgba).padStart(3)}  px ${String(b.px).padStart(4)}  ms ${String(b.ms).padStart(3)}   (${b.files} files)`;
    console.log('tokens-audit — literal count per DS');
    console.log('');
    for (const ds of DESIGN_SYSTEMS) console.log(fmt(ds, perDs[ds]));
    if (other.files > 0) console.log(fmt('shared', other));
    console.log('');
    console.log(`  total     hex ${report.totals.hex}  rgba ${report.totals.rgba}  px ${report.totals.px}  ms ${report.totals.ms}`);
    console.log('');
  }

  if (write) {
    await writeFile(BASELINE, JSON.stringify(report, null, 2) + '\n', 'utf8');
    console.log(`baseline written → ${relative(ROOT, BASELINE)}`);
    return;
  }

  // Diff vs baseline — exit 1 if any category rose
  let baseline = null;
  try {
    baseline = JSON.parse(await readFile(BASELINE, 'utf8'));
  } catch {
    console.log('no baseline yet — run with --write to create one');
    return;
  }

  const delta = {
    hex: report.totals.hex - baseline.totals.hex,
    rgba: report.totals.rgba - baseline.totals.rgba,
    px: report.totals.px - baseline.totals.px,
    ms: report.totals.ms - baseline.totals.ms,
  };
  const rose = Object.values(delta).some((v) => v > 0);
  const fell = Object.values(delta).some((v) => v < 0);

  console.log('delta vs baseline:');
  for (const [k, v] of Object.entries(delta)) {
    const sign = v > 0 ? '+' : '';
    const tag = v > 0 ? ' ✗ ROSE' : v < 0 ? ' ✓' : '';
    console.log(`  ${k.padEnd(4)}  ${sign}${v}${tag}`);
  }

  if (rose) {
    console.log('\n✗ literal count rose vs baseline — PR adds hardcoded values');
    process.exit(1);
  }
  if (fell) {
    console.log('\n✓ literals removed. Run with --write to refresh baseline.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
