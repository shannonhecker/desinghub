# Tokens — Design Hub DS Migration Reference

Design Hub's design-token schema and the rules governing the zero-hardcoded-values migration across all 5 design systems.

Status: **P0 foundation** (scaffolding landed on `feat/tokens-foundation`). Per-DS phases (P1–P5) are gated on this PR and the user's 7 open-question answers (see memory: `project_ds_tokenisation.md`).

Audit baseline: `scripts/tokens-baseline.json`. Refresh with `npm run tokens:audit:write` after a token-removing change.

---

## Principles

1. **No raw values in renderers or CSS output.** Every color, spacing, font size/weight/line-height, radius, shadow, duration, easing, opacity, and border-width resolves through a named token.
2. **Per-DS sovereignty.** Each DS keeps its spec-correct token names (M3 `short1..long2`, Carbon `productive/expressive`, Fluent `durationFaster/Fast/Normal`, Salt `fast/normal/slow`, ausos `glass-*`). We unify primitive values in `src/data/_shared/primitives.ts`; we do **not** unify names.
3. **Variants are explicit.** Mode × density × state × size resolve through declared axes (see §Variant matrix). Nothing hides in a cascade.
4. **Lint + CI enforce it.** ESLint catches AST-visible literals; `scripts/tokens-audit.mjs` catches template-literal interpolations. Both run per PR.

---

## Token schema

Flat naming. No CSS cascading tricks — each DS owns its namespace. Design Hub renders one DS at a time.

```
--<ds>-<category>-<intent>[-<state>][-<size>]
```

Grammar by category:

| Category | Pattern | Example |
|---|---|---|
| Color (semantic) | `--<ds>-color-<intent>[-<state>]` | `--salt-color-accent-fg`, `--salt-color-accent-fg-hover` |
| Color (container) | `--<ds>-color-<container>-{bg,fg,border}` | `--m3-color-primary-container-bg` |
| Spacing | `--<ds>-space-{50,100,150,200,300,400,...}` | `--salt-space-200` |
| Radius | `--<ds>-radius-{none,xs,sm,md,lg,xl,full}` | `--m3-shape-medium` (M3 uses spec names) |
| Type size | `--<ds>-type-size-{xs..3xl}` | `--cds-type-size-body-01` |
| Type weight | `--<ds>-type-weight-{400,500,700}` | `--salt-type-weight-500` |
| Type lh | `--<ds>-type-lh-{tight,normal,loose}` | `--m3-type-lh-normal` |
| Elevation | `--<ds>-elev-{sm,md,lg,xl}` | `--fluent-elev-md` |
| Motion dur | `--<ds>-dur-<name>` | `--m3-dur-short3`, `--salt-dur-fast` |
| Motion ease | `--<ds>-ease-<name>` | `--m3-ease-standard`, `--cds-ease-productive` |
| Opacity | `--<ds>-opacity-<intent>` | `--a-opacity-glass-02`, `--m3-opacity-disabled` |
| Border width | `--<ds>-border-{hair,thin,thick,focus}` | `--salt-border-focus` |

Resolution axes:

- **Mode** (light/dark/contrast) → theme-object swap via `activateTheme()`. Never in token name.
- **Density** (compact/default/comfortable/touch) → `DENSITY_MAP` / `SIZE_MAP` resolves scale-index → px. Not in name; name is scale-level.
- **State** (hover/focus/pressed/disabled/selected) → suffix on interactive color + opacity tokens only.
- **Size** (Fluent S/M/L) → component-prop variants via `SIZE_MAP`. Not in token name.

---

## Variant matrix

| Category | Mode | Density | State | Size |
|---|:---:|:---:|:---:|:---:|
| Color (bg/fg/border) | ✓ | — | ✓ | — |
| Color (accent/status) | ✓ | — | ✓ | — |
| Spacing | — | ✓ | — | — |
| Radius | — | partial (ausos/Salt) | — | — |
| Type size | — | ✓ | — | ✓ |
| Type weight / lh | — | — | — | — |
| Elevation | ✓ | — | ✓ (hover raise) | — |
| Motion duration | — | — | — | — |
| Motion easing | — | — | — | — |
| Opacity | — | — | ✓ | — |
| Border width | — | partial | ✓ (focus) | — |

Machine-readable variant matrix: `VARIANT_MATRIX` in `src/data/_shared/variant-contract.ts`.

---

## Shared primitives

`src/data/_shared/primitives.ts` holds raw values — duration ms, easing cubic-beziers, opacity decimals, border widths, font weights, line heights. **Each DS imports primitives and re-exports under spec-correct names**. Renderers import the DS alias, never the shared primitive.

```
src/data/_shared/primitives.ts
  DURATION_MS = { instant: 0, fast: 100, short: 150, medium: 200, long: 300, ... }
  EASING      = { standard, emphasized, productive, expressive, ... }
  OPACITY     = { 4: 0.04, 8: 0.08, 12: 0.12, 24: 0.24, 38: 0.38, ... }
  BORDER_WIDTH_PX = { hair: 0.5, thin: 1, thick: 2, focus: 2 }
  FONT_WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 }
  LINE_HEIGHT = { tight: 1.2, normal: 1.5, loose: 1.75 }

src/data/m3/motion.ts          → M3_MOTION     { short1, short2, long1, ... }  via DURATION_MS + EASING
src/data/carbon/motion.ts      → CARBON_MOTION { productive, expressive }
src/data/fluent/motion.ts      → FLUENT_MOTION { durationFaster, durationFast, durationNormal }
src/data/salt/motion.ts        → SALT_MOTION   { fast, normal, slow }
src/data/ausos/motion.ts       → AUSOS_MOTION  { glass-fade, glass-rise }
```

---

## Intentional literals (do not touch)

Values that **look** hardcoded but are correct by design. The ESLint rule and audit script both allowlist these.

| Target | Why | Location |
|---|---|---|
| `MATERIAL_COLORS` | Reference swatches for M3 dynamic theming (HCT color-space source) | `src/data/m3/m3-documentation.jsx:134–153` |
| Per-DS `DENSITY_MAP` / `SIZE_MAP` | These **are** tokens — density scale-indexes resolved to px. Changing these changes the scale definition itself. | `src/data/registry.ts:182–207`, plus each DS's density functions |
| `CARBON_DENSITY_MAP` | Preview-chrome scale (4px) — separate layer from Carbon internals (2px). See Design-Hub CLAUDE.md §1. | `src/data/registry.ts` |
| `code-snippets.ts` (all 5 DS) | Teaching material — must show raw values so developers see what they're copying | `src/data/<ds>/code-snippets.ts` |
| `--bc-*` builder chrome tokens | Intentionally isolated from DS tokens so builder chrome renders above canvas regardless of active DS | `chrome-tokens.css` |
| Carbon `cr:0` | Swiss/flat design philosophy — radius is always zero, not a missing value | Carbon DENSITY_MAP entries |
| Sprint 2525492 builder code | Out of scope for migration; do not touch | `src/components/builder/`, `src/store/` |

Suppressions in source:

- `// eslint-disable-next-line design-hub/no-hardcoded-tokens` — single line
- `// tokens-audit-ignore` — at end of any line; hides that line from the grep sweep
- `// tokens-audit-ignore-block` / `// tokens-audit-ignore-end` — for multi-line exempt regions

Use suppressions sparingly and pair them with a comment explaining **why** the literal is intentional.

---

## Phased migration

| # | Phase | Branch | Gate |
|---|---|---|---|
| **P0** | Foundation — types + audit script + screenshot matrix + ESLint rule at `warn` + `docs/TOKENS.md` | `feat/tokens-foundation` | Lint green, zero visual diff, baseline captured |
| **P1** | ausos — promote 10 inline `rgba(…)` glass layers + `AUSOS_MOTION/OPACITY/RADIUS`. Blur elevation stays; opt-in `--a-shadow-*` added for parity. | `feat/tokens-ausos` | 4 densities × 2 themes |
| **P2** | Fluent — extract `cardRadius`, add `FLUENT_MOTION`, extract hardcoded shadows. | `feat/tokens-fluent` | 3 sizes × 2 themes |
| **P3** | Carbon — extract 12 hardcoded font-size px → `--cds-type-*` matching IBM scale. Add `CARBON_MOTION`. Preserve two density layers. Promote preview chrome 4px into `--bc-*` namespace. | `feat/tokens-carbon` | 3 densities × 4 themes |
| **P4** | M3 — replace inline 20/12/8 radius with `--m3-shape-*`, extract 3 inline type escapes. Refactor PR #13 drafts (search-bar, segmented-buttons, shape-tokens, density-tokens) through token system. | `feat/tokens-m3` | 4 themes × 3 density offsets |
| **P5** | Salt — pull type tokens from `@salt-ds/theme/theme-next.css` in node_modules (pin version). Promote inline rgba shadows. | `feat/tokens-salt` | 4 densities × 4 themes |
| **P6** | Enforcement flip — ESLint `warn` → `error`, pre-commit hook, CI fails on new literals. | `feat/tokens-enforce` | CI red on seeded violation test |

See `~/.claude/plans/cheerful-munching-blum.md` for full scope, risks, and critical-file list.

---

## npm scripts

```
npm run tokens:audit         # run audit, exit 1 if literal count rose vs baseline
npm run tokens:audit:write   # refresh the baseline (after a literal-removing PR)
npm run tokens:audit:json    # machine-readable output for CI parsing

npm run ss                   # capture screenshots → diff vs latest local baseline
npm run ss:baseline          # capture + save local baseline (gitignored)
```

Screenshot matrix requires `@playwright/test` (install on demand):

```
npm i -D @playwright/test
npx playwright install chromium
```

---

## Contributing

**Before writing a hex color, spacing value, font size, duration, or radius:**

1. Check if the active DS already has a matching token (`grep --<ds>- src/data/<ds>/*.jsx`).
2. If it doesn't, **name the token first**, add it to the DS's theme object / motion export, then use it in the renderer.
3. Never introduce a token that isn't backed by a primitive in `src/data/_shared/primitives.ts` (unless the value is genuinely DS-specific — e.g. a Carbon semantic color).
4. Run `npm run tokens:audit` before opening a PR — CI will too.
