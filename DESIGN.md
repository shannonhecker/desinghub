---
name: uoaui
description: AI Design-System Builder for product teams. One brief, five systems, one defended decision.
colors:
  observatory-iris: "#6750a4"
  solar-lilac: "#b490f5"
  aurora-cyan: "#5ee7df"
  aurora-blue: "#3b82f6"
  aurora-violet-deep: "#8b5cf6"
  aurora-rose: "#f7a8c4"
  aurora-magenta: "#d946ef"
  observatory-night: "#0b0e1a"
  outer-dark: "#020302"
  studio-soft: "#060806"
  brand-fg: "#ffffff"
  brand-fg-muted: "rgba(255,255,255,0.7)"
  brand-fg-disabled: "rgba(255,255,255,0.38)"
  accent-mint: "#c5f4de"
  accent-acid: "#d9f272"
  accent-blue: "#86bdf0"
  accent-rose-warm: "#df9b93"
  accent-amber: "#ffad5c"
  surface-cream: "#eef3ec"
  warn-bg: "#f6d778"
  warn-fg: "#221b00"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(3.1rem, 6vw, 5.6rem)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.005em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.68
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.06em"
  mono:
    fontFamily: "SF Mono, Fira Code, JetBrains Mono, ui-monospace"
    fontSize: "0.78rem"
    fontWeight: 500
    lineHeight: 1.65
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "16px"
  pill: "28px"
  full: "9999px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, {colors.aurora-cyan} 0%, {colors.solar-lilac} 48%, {colors.solar-lilac} 100%)"
    textColor: "{colors.outer-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "linear-gradient(135deg, {colors.aurora-cyan} 0%, {colors.aurora-violet-deep} 46%, {colors.aurora-violet-deep} 100%)"
    textColor: "{colors.outer-dark}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.03)"
    textColor: "{colors.brand-fg}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "rgba(255,255,255,0.06)"
    textColor: "{colors.brand-fg}"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "rgba(255,255,255,0.055)"
    textColor: "{colors.brand-fg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 40px 0 12px"
    height: "46px"
  card-surface:
    backgroundColor: "rgba(8,12,22,0.82)"
    textColor: "{colors.brand-fg}"
    rounded: "{rounded.md}"
    padding: "32px"
  chip-proof:
    backgroundColor: "rgba(255,255,255,0.045)"
    textColor: "{colors.brand-fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "32px"
  nav-item-active:
    backgroundColor: "rgba(149,117,240,0.10)"
    textColor: "{colors.solar-lilac}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: uoaui

## 1. Overview

**Creative North Star: "The Aurora Observatory"**

uoaui is built like an observatory — a calm vantage point from which to study moving phenomena. The aurora, the beam shader, the five design-system specimens on the workbench: all of it lives beneath a stable instrument-grade chrome. The phenomena move; the observer doesn't. That's the visual contract.

This system explicitly rejects the four reflexes of category-coded AI tooling: it is not a SaaS dashboard, it is not the Tailwind / shadcn default, it is not crypto-on-black neon glow, and it is not bento-grid template feel. Substance over showmanship. The aurora is a greeting; the recommendation is the point.

**Key Characteristics:**

- **Flat tonal + functional glass.** Surfaces are flat at rest. Shadows appear only on state change (hover, focus, dialog). Glass-morphic panels carry inset highlights, not lift.
- **Solid and quiet components.** Borders and tonal opacity stacks do the work cards usually do. Cards as containers are the exception, not the default.
- **Aurora as constant, not ornament.** The cyan / violet / rose palette ties hero, login, and builder atmosphere together. It is the observatory's sky.
- **Two-voice token system.** Brand surfaces (landing, login) use Material-coded violet `#6750a4`; builder chrome uses lighter violet `#9575F0` for legibility on dark glass. Both are intentional, neither is wrong.

## 2. Colors

A restrained palette anchored by indigo night and Material-coded violet, with an aurora ribbon (cyan → violet → rose) that runs across hero, gradient buttons, and atmospheric moments.

### Primary

- **Observatory Iris** (`#6750a4`): The brand violet. Material's deep purple, used as the brand surface anchor — login lockup tints, focus rings on brand pages, the canonical "uoaui" violet. Tints to **Solar Lilac** (`#b490f5`) for hover, gradient terminals, and atmospheric overlays.

### Secondary (Aurora Ribbon)

- **Aurora Cyan** (`#5ee7df`): The dominant aurora opener. Used as the gradient start on the primary CTA, focus-ring color (4px halo at 22% opacity), and the leftmost preview swatch.
- **Aurora Violet (Deep)** (`#8b5cf6`): Gradient mid/terminal on hover states. The "warmer" violet step from Solar Lilac.
- **Aurora Rose** (`#f7a8c4`): Atmospheric blob 3 inner; reserved for ambient backgrounds, never for foreground type or interactive surfaces.
- **Aurora Magenta** (`#d946ef`): Aurora blob 3 outer terminal. Same restraint as Aurora Rose.

### Tertiary (Accent set, for status & system markers)

- **Accent Mint** (`#c5f4de`), **Accent Acid** (`#d9f272`), **Accent Blue** (`#86bdf0`), **Accent Rose Warm** (`#df9b93`), **Accent Amber** (`#ffad5c`): A five-color set used only as stage markers, system status, and per-DS swatches. Never used for chrome or CTAs.

### Neutral

- **Observatory Night** (`#0b0e1a`): The brand surface background. Login, landing hero, auth shells.
- **Outer Dark** (`#020302`): The page background floor — deeper than Observatory Night, used behind the brand surface for separation.
- **Studio Soft** (`#060806`): A small step up from Outer Dark for stage overlays.
- **Brand FG** (`#ffffff`) with semantic opacity: muted 70%, disabled 38%. Pure white only on dark surfaces; pair with tonal opacity for hierarchy.
- **Surface Cream** (`#eef3ec`): Reserved for light-mode previews and per-DS canvas backgrounds. Not for chrome.

### Named Rules

**The Aurora-as-Constant Rule.** The aurora ribbon (cyan, violet, rose) appears on every brand surface as ambient atmosphere. Never break it into a single accent. Never recolor it to brand-primary alone. The ribbon IS uoaui.

**The Two-Voice Rule.** Brand surfaces use **Observatory Iris** `#6750a4`. Builder chrome uses **builder-accent** `#9575F0` (a lighter violet that reads better on dark glass). Don't unify them. The distinction is the principle "Five systems coexist; uoaui owns the chrome" applied to our own surfaces.

**The Accent Restraint Rule.** The five-color accent set is reserved for stage markers, system status, and per-DS swatches. It does not bleed into chrome, CTAs, or copy. Total accent coverage per screen ≤8%.

## 3. Typography

**Display Font:** Outfit (preloaded, weights 300–600). Geometric humanist sans with subtle warmth. The voice of hero h1 and landing display moments.

**Headline / Stage Font:** Space Grotesk (preloaded, weights 300–700). Slightly more architectural than Outfit; used for hero stage labels and landing nav.

**Body / UI Font:** DM Sans (weights 300–700). The workhorse for builder chrome, toasts, body copy. Pairs cleanly with Outfit and Space Grotesk.

**Code / Mono Font:** "SF Mono", "Fira Code", "JetBrains Mono", `ui-monospace`. Used in code panels, token tables, and DS-specific code previews.

**Note on DS-preview fonts:** Inter, Roboto, IBM Plex Sans / Mono, Open Sans, and Material Symbols are loaded on demand for **per-system fidelity** (Carbon previews load IBM Plex; M3 previews load Roboto + Material Symbols). They are not uoaui voice fonts; do not pull them into chrome.

**Character:** A confident humanist-geometric pairing. Outfit's slightly soft display register grounds the aurora's brightness; Space Grotesk's architectural cleanliness reads as the observatory's instrument readout; DM Sans is the calm body voice that doesn't compete.

### Hierarchy

- **Display** (Outfit 500, clamp(3.1rem, 6vw, 5.6rem), 0.92 LH, -0.01em): Hero h1, login h1. One per page.
- **Headline** (Space Grotesk 600, clamp(1.5rem, 2.4vw, 2.1rem), 1.08 LH, -0.005em): Landing section headings, hero stage labels.
- **Title** (DM Sans 600, 1.02rem, 1.25 LH): Card titles, settings group titles, builder panel headers.
- **Body** (DM Sans 400, 1rem, 1.68 LH): Paragraph copy, descriptions, helper text. Cap at 65–75ch line length.
- **Label** (DM Sans 800, 0.74rem, 1.2 LH, 0.06em letter-spacing, uppercase): Chips, kickers, status badges, kicker eyebrows.
- **Mono** (SF Mono stack 500, 0.78rem, 1.65 LH): Code blocks, token tables, hex strings, DS code previews.

### Named Rules

**The One-Display Rule.** A page carries one Display element. Heroes and login screens are the only legitimate hosts. Never use Display for section headings — that's what Headline is for.

**The Uppercase-Label-Only Rule.** Uppercase + 0.06em tracking is reserved for the Label role. Never apply it to Body, Title, or Headline. Uppercase Title is the cliché of generic SaaS subheadings; we don't do it.

## 4. Elevation

uoaui is **flat tonal + functional glass.** Default surfaces are flat — backgrounds layered through opacity stacks (e.g. `rgba(255,255,255,0.045)` for chip, `rgba(8,12,22,0.82)` for card). Shadows appear only when state demands: hover lift, focus halo, dialog elevation. Glass-morphic surfaces add **inset highlights** for light response, not drop shadows for lift.

### Shadow Vocabulary

- **dh-shadow-sm** (`0 1px 2px rgba(0,0,0,0.28), 0 1px 1px rgba(0,0,0,0.14)`): Hover lift on chrome buttons. Light-mode equivalent uses indigo-tinted black at 8%.
- **dh-shadow-md** (`0 4px 12px rgba(0,0,0,0.32), 0 2px 4px rgba(0,0,0,0.16)`): Toast notifications, dropdowns, low-elevation popovers.
- **dh-shadow-lg** (`0 12px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.18)`): Login card ambient, dialog overlays, the rare high-elevation panel.
- **dh-shadow-focus** (`0 0 0 2px var(--ds-primary), 0 0 0 4px rgba(94,231,223,0.22)`): The canonical focus ring. Cyan halo, 4px ring, 22% opacity. Used on inputs, buttons, links, anywhere focus matters.

### Named Rules

**The Functional Shadow Rule.** Shadows are reserved for state change or genuine elevation (modal over page, popover over surface). A card at rest has no shadow. Period. Glass-morphic insets are not shadows; they are light treatment, and they are allowed.

**The Cyan Focus Rule.** Focus rings use the aurora cyan halo, not the brand primary. This is so focus reads independent of brand theming and stays legible across builder-light / builder-dark / DS preview modes.

## 5. Components

**Component philosophy: solid and quiet.** Each component reads with restraint; the aurora ribbon and gradient buttons are the only "loud" components. Everything else uses 1px borders, tonal opacity, and inset highlights.

### Buttons

**Primary.** The signature CTA. 46px tall, 10px radius (`{rounded.md}`), aurora gradient background (Aurora Cyan → Solar Lilac), Outer Dark text. Hover: gradient shifts to Aurora Cyan → Aurora Violet Deep, button lifts 1px (`translateY(-1px)`), shadow expands. Disabled: 62% opacity, no lift.

**Ghost / Top-bar.** Builder chrome navigation. 44px tall, 10px radius, `rgba(255,255,255,0.03)` background, 1px border at `rgba(255,255,255,0.08)`, Brand FG text. Hover: 1px lift, border to 12% opacity, background to 6%. Active: border + text shift to Solar Lilac, background tints `rgba(149,117,240,0.10)`.

### Inputs / Fields

46px tall, 10px radius, `rgba(255,255,255,0.055)` background, 1px border at 11% opacity. Hover (not focused): border to 20%. **Focus:** border to Aurora Cyan 62%, background to 7.5%, 4px halo at 15% Aurora Cyan opacity. **Error:** border to `rgba(255,120,120,0.62)`.

### Cards / Containers

10px radius, padding `var(--dh-space-32)` (32px) for primary cards. Background: triple-stacked — base `rgba(8,12,22,0.82)`, top gradient overlay `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.045))`, radial mint glow at 24% 0%. Backdrop-filter blur 26px. Inset highlight `0 1px 0 rgba(255,255,255,0.12)`. Ambient shadow only on the elevated login-card variant; everyday card surfaces ship with no shadow.

### Chips / Tags

32px tall, 6px radius (`{rounded.sm}`), `rgba(255,255,255,0.045)` background, 1px border at 9% opacity. Label typography (0.74rem, weight 800, uppercase, 0.06em tracking). Used as proof badges, status markers, DS labels.

### Navigation

**Landing nav.** Anchor links sit on Observatory Night with no background; underline-on-hover only. **Builder top-bar items.** Use Ghost button styling above. **Builder sidebar (240px fixed width).** Items use 10px radius, padding 8px 16px, hover background `rgba(255,255,255,0.06)`, active state tints to builder-accent.

### Signature Component: HeroBeam

A WebGL Three.js shader rendering the aurora ribbon as living atmosphere. Mouse-parallaxed sine + Perlin noise generates flowing bands of cyan, violet, and rose across the canvas. **It is not decoration.** It is the observatory's sky — the constant beneath which the work happens. Reduced-motion preference replaces it with a static cross-fade gradient capture. Lives at `/src/components/hero-beam/HeroBeam.tsx`.

## 6. Do's and Don'ts

### Do:

- **Do** anchor the brand surface in Observatory Iris `#6750a4` + Solar Lilac `#b490f5`. The aurora ribbon (cyan / violet / rose) is the secondary palette.
- **Do** use the cyan focus ring (`dh-shadow-focus`) on every interactive element. It is the canonical focus signal.
- **Do** keep surfaces flat at rest. Use opacity stacks and 1px borders for depth, not drop shadows.
- **Do** cap body copy at 65–75ch line length. Display has no line-length cap; Body always does.
- **Do** preserve each DS's own tokens and typography when rendering its preview. Salt looks like Salt; M3 looks like M3. **Practice what you preach.**
- **Do** respect `prefers-reduced-motion` fully. Aurora animation pauses; HeroBeam falls back to static gradient; scroll-driven reveals become instant. No information conveyed by motion alone.

### Don't:

- **Don't** look like a generic SaaS dashboard. No sidebar-nav + card-grid + stat-counter hero. No "AI-powered" subheading. The shape of every YC landing 2024–2026 is the cliché to avoid.
- **Don't** use Tailwind / shadcn default look. No slate-gray-on-white, no rounded-md-card-grid, no Inter-everywhere. Inter is allowed in builder UI; never as the brand-surface display font.
- **Don't** push toward crypto / AI neon-on-black aesthetic. The aurora is bright; the surrounding chrome is restrained. Animated grid backgrounds and "futuristic" chrome are off-limits.
- **Don't** lay out in bento grids. The Apple-style irregular tile grid reads as 2025-template AI-tool now. Use rhythm, vertical stacking, and asymmetric pacing instead.
- **Don't** use uppercase + tracking on Body, Title, or Headline. Uppercase is reserved for the Label role. Uppercase Title is the SaaS subheading cliché.
- **Don't** drop shadow as default elevation. Shadows respond to state; rest is flat. A card with `box-shadow` at rest is doing the wrong job.
- **Don't** use border-left / border-right >1px as a colored accent stripe. Side-stripe borders are off-limits across the system.
- **Don't** use gradient text (`background-clip: text` + gradient). The aurora ribbon lives in surfaces and CTAs, not in display type. Emphasis is via weight and size, not gradient fill.
- **Don't** treat the HeroBeam as decoration. It is the observatory's sky — atmospheric, but earned. Removing it should feel like loss, not relief.
