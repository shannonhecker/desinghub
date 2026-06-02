#!/usr/bin/env bash
#
# Export-verification harness — the ORACLE.
#
# For each of the 5 design systems (salt, m3, fluent, carbon, uoaui):
#   1. Generate the real Vite bootstrap from scripts/fixtures/<ds>-canvas.json
#      (generate-export.mjs hydrates the real store + calls exportViteBootstrap).
#   2. Run the generated `design-hub-app.sh` in a temp dir to materialise the
#      project on disk (its trailing `npm install` step is skipped — we install
#      explicitly so a registry/network hiccup is reported as INSTALL, not a
#      generation failure).
#   3. `npm install` + `npm run build` (the exported package.json's build is
#      `tsc -b && vite build`) — proves the downloaded project COMPILES + BUILDS.
#   4. Report pass/fail per DS. Exit nonzero if ANY DS fails.
#
# Usage:
#   scripts/verify-exports.sh                 # all 5 design systems
#   scripts/verify-exports.sh salt m3         # a subset
#   DS_LIST="fluent" scripts/verify-exports.sh
#
# Env knobs:
#   KEEP_TMP=1      keep the temp working dirs for inspection (default: clean up)
#   WORK_ROOT=dir   base dir for temp projects (default: a mktemp dir)
#
# CI-friendly: deterministic exit code, no interactive prompts, per-DS summary.

set -u

# ── Locate the repo root (this script lives in <root>/scripts) ────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_DIR="$SCRIPT_DIR/fixtures"
# generate-export.mjs is selected via the dedicated config's `include`.
VITEST_CONFIG="$SCRIPT_DIR/export-verify.vitest.config.ts"

# The generator runs as a one-off vitest spec (see generate-export.mjs header).
# `--pool=threads` is used because the default forks pool fails to spawn a worker
# on some local filesystems (iCloud-synced worktrees); threads is portable and
# behaves identically in CI.
VITEST_ARGS=(run -c "$VITEST_CONFIG" --no-coverage --reporter=dot --pool=threads)

# ── Which design systems to verify ───────────────────────────────────────────
if [ "$#" -gt 0 ]; then
  SYSTEMS=("$@")
elif [ -n "${DS_LIST:-}" ]; then
  # shellcheck disable=SC2206
  SYSTEMS=(${DS_LIST})
else
  SYSTEMS=(salt m3 fluent carbon uoaui)
fi

# ── Temp working root ─────────────────────────────────────────────────────────
WORK_ROOT="${WORK_ROOT:-$(mktemp -d "${TMPDIR:-/tmp}/dh-export-verify.XXXXXX")}"
mkdir -p "$WORK_ROOT"

cleanup() {
  if [ "${KEEP_TMP:-0}" != "1" ]; then
    rm -rf "$WORK_ROOT"
  else
    echo ""
    echo "KEEP_TMP=1 — temp projects kept at: $WORK_ROOT"
  fi
}
trap cleanup EXIT

echo "════════════════════════════════════════════════════════════════"
echo " Design Hub — export-verification harness"
echo " repo:     $ROOT_DIR"
echo " systems:  ${SYSTEMS[*]}"
echo " work dir: $WORK_ROOT"
echo "════════════════════════════════════════════════════════════════"

declare -a RESULTS=()
OVERALL=0

for DS in "${SYSTEMS[@]}"; do
  echo ""
  echo "────────────────────────────────────────────────────────────────"
  echo "▶ $DS"
  echo "────────────────────────────────────────────────────────────────"

  FIXTURE="$FIXTURE_DIR/${DS}-canvas.json"
  if [ ! -f "$FIXTURE" ]; then
    echo "  ✗ no fixture: $FIXTURE"
    RESULTS+=("$DS: FAIL (no fixture)")
    OVERALL=1
    continue
  fi

  DS_DIR="$WORK_ROOT/$DS"
  EXPORT_DIR="$DS_DIR/export"
  BUILD_DIR="$DS_DIR/build"
  mkdir -p "$EXPORT_DIR" "$BUILD_DIR"

  # ── 1. Generate the bootstrap script via the real exporter (through vitest) ──
  echo "  → generating bootstrap…"
  if ! ( cd "$ROOT_DIR" && EXPORT_FIXTURE="$FIXTURE" EXPORT_OUT="$EXPORT_DIR" \
      npx vitest "${VITEST_ARGS[@]}" ) \
      > "$DS_DIR/generate.log" 2>&1; then
    echo "  ✗ GENERATE failed (see $DS_DIR/generate.log)"
    tail -n 20 "$DS_DIR/generate.log" | sed 's/^/    /'
    RESULTS+=("$DS: FAIL (generate)")
    OVERALL=1
    continue
  fi

  BOOTSTRAP="$EXPORT_DIR/design-hub-app.sh"
  if [ ! -f "$BOOTSTRAP" ]; then
    echo "  ✗ GENERATE produced no bootstrap script"
    RESULTS+=("$DS: FAIL (no bootstrap)")
    OVERALL=1
    continue
  fi
  echo "    ✔ $(wc -c < "$BOOTSTRAP" | tr -d ' ') bytes -> $BOOTSTRAP"

  # ── 2. Materialise the project. The bootstrap's tail runs `npm install`;
  #       we strip everything from the install banner onward so this step only
  #       writes files. We then install/build explicitly (clearer failure modes).
  echo "  → materialising project…"
  MATERIALISE="$BUILD_DIR/materialise.sh"
  awk '/^echo "→ Installing dependencies/{exit} {print}' "$BOOTSTRAP" > "$MATERIALISE"
  if ! ( cd "$BUILD_DIR" && sh "$MATERIALISE" ) > "$DS_DIR/materialise.log" 2>&1; then
    echo "  ✗ MATERIALISE failed (see $DS_DIR/materialise.log)"
    tail -n 20 "$DS_DIR/materialise.log" | sed 's/^/    /'
    RESULTS+=("$DS: FAIL (materialise)")
    OVERALL=1
    continue
  fi
  PROJECT_DIR="$BUILD_DIR/design-hub-app"
  if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "  ✗ MATERIALISE produced no package.json"
    RESULTS+=("$DS: FAIL (no project)")
    OVERALL=1
    continue
  fi
  echo "    ✔ $PROJECT_DIR"

  # ── 3. Install deps ──────────────────────────────────────────────────────────
  echo "  → npm install…"
  if ! ( cd "$PROJECT_DIR" && npm install --no-audit --no-fund ) \
      > "$DS_DIR/install.log" 2>&1; then
    echo "  ✗ INSTALL failed (see $DS_DIR/install.log)"
    tail -n 30 "$DS_DIR/install.log" | sed 's/^/    /'
    RESULTS+=("$DS: FAIL (install)")
    OVERALL=1
    continue
  fi
  echo "    ✔ dependencies installed"

  # ── 4. Build (tsc -b && vite build) ──────────────────────────────────────────
  echo "  → npm run build…"
  if ! ( cd "$PROJECT_DIR" && npm run build ) > "$DS_DIR/build.log" 2>&1; then
    echo "  ✗ BUILD failed (see $DS_DIR/build.log)"
    tail -n 40 "$DS_DIR/build.log" | sed 's/^/    /'
    RESULTS+=("$DS: FAIL (build)")
    OVERALL=1
    continue
  fi

  echo "  ✔ $DS — export compiles + builds"
  RESULTS+=("$DS: PASS")
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " SUMMARY"
echo "════════════════════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do
  case "$r" in
    *PASS) echo "  ✔ $r" ;;
    *)     echo "  ✗ $r" ;;
  esac
done
echo "════════════════════════════════════════════════════════════════"

if [ "$OVERALL" -ne 0 ]; then
  echo "One or more design-system exports failed to build."
fi
exit "$OVERALL"
