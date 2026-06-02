/**
 * Export-verification harness — generator step.
 *
 * Given a builder-canvas fixture (scripts/fixtures/<ds>-canvas.json), hydrate the
 * REAL Zustand builder store and call the REAL exporter (exportViteBootstrap)
 * to produce the self-extracting `design-hub-app.sh` bootstrap script, written
 * to a destination directory. verify-exports.sh then materialises + builds it.
 *
 * Why this file is run THROUGH vitest (not plain `node`):
 *   The exporter and its dependency graph (componentApiRegistry, chartExporter,
 *   the useBuilder store) are TypeScript modules that import via the `@/` path
 *   alias. The project is Next.js — there is no standalone `vite`/`tsx`/`vite-node`
 *   binary installed. vitest IS installed and resolves both TS and the `@/` alias
 *   (see vitest.config.ts), so running this as a one-off vitest spec gives us the
 *   exact same module resolution CI uses for `npm run test`. It asserts nothing
 *   about the app; it is a thin driver whose only job is to emit the bootstrap.
 *
 * Driven by env vars (set by verify-exports.sh):
 *   EXPORT_FIXTURE  absolute/relative path to a <ds>-canvas.json fixture
 *   EXPORT_OUT      directory to write the bootstrap script into (created if absent)
 *
 * The file uses a `.mjs` extension but is intentionally a vitest spec
 * (`it(...)`) so it can be passed straight to `vitest run`.
 */
import { it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { useBuilder } from "@/store/useBuilder";
import { exportViteBootstrap, viteBootstrapFilename } from "@/lib/export/viteExporter";

it("generates a Vite bootstrap from a canvas fixture", () => {
  const fixturePath = process.env.EXPORT_FIXTURE;
  const outDir = process.env.EXPORT_OUT;
  if (!fixturePath || !outDir) {
    throw new Error(
      "generate-export: EXPORT_FIXTURE and EXPORT_OUT env vars are required",
    );
  }

  const fixture = JSON.parse(readFileSync(resolve(fixturePath), "utf8"));

  // Hydrate the real store from the fixture. The exporter reads
  // designSystem / mode / density + the four zone arrays via useBuilder.getState().
  useBuilder.setState({
    designSystem: fixture.designSystem,
    mode: fixture.mode ?? "dark",
    density: fixture.density ?? "medium",
    blocks: fixture.blocks ?? [],
    headerBlocks: fixture.headerBlocks ?? [],
    sidebarBlocks: fixture.sidebarBlocks ?? [],
    footerBlocks: fixture.footerBlocks ?? [],
  });

  const script = exportViteBootstrap();
  expect(script.startsWith("#!/bin/sh")).toBe(true);
  expect(script).not.toMatch(/^echo "Design Hub export too large/m);

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, viteBootstrapFilename());
  writeFileSync(outPath, script, "utf8");

  // Emit the path so the shell wrapper can locate the script deterministically.
  process.stdout.write(`\nEXPORT_BOOTSTRAP=${outPath}\n`);
});
