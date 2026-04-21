---
description: 
alwaysApply: true
---

# Design System Rules — Figma-to-Code Integration

This document defines the design system rules for translating Figma designs into production code. It covers five supported design systems: **Salt DS** (J.P. Morgan), **Material 3** (Google), **Fluent 2** (Microsoft), **Carbon DS** (IBM), and **ausos DS** (internal).

Design Hub's live inventory per DS (from `src/data/<ds>/*-documentation.jsx`): Salt 70, Carbon 68, M3 44, Fluent 40, ausos 40. These are Design Hub's own reference entries; the upstream-library counts below (e.g., "Salt DS (57 components)") refer to each DS's official package.

---

## 1. Token Definitions

### Salt DS
- **Location:** `@salt-ds/theme` npm package → `theme-next.css`
- **Format:** Pure CSS custom properties, 3-layer architecture
- **Layers:**
  - Foundation: `--salt-color-teal-500`, `--salt-size-base`
  - Palette: `--salt-palette-accent`, `--salt-palette-negative`
  - Characteristic: `--salt-actionable-bold-background`
- **Density tokens** scale all values across 4 levels (High/Medium/Low/Touch)
- Reference: `/mnt/skills/user/Salt/references/tokens.md`

### Material 3
- **Format:** Design tokens via `--md-sys-color-*`, `--md-sys-typescale-*`
- **Key groups:** Primary, Secondary, Tertiary, Error, Surface (6 container levels), Outline
- **Dynamic color:** Generated from source color via HCT color space
- Reference: `/mnt/skills/user/UI Kit/references/tokens.md`

### Fluent 2
- **Format:** CSS custom properties via `--color*`, `--fontFamily*`, `--fontSize*`
- **Key groups:** Neutral (bg1-6, fg1-4), Brand (bg/fg/stroke), Status (danger/success/warning)
- Reference: `/mnt/skills/user/Fluent/references/tokens.md`

### Carbon DS
- **Format:** CSS custom properties via `--cds-*` (canonical IBM prefix)
- **Key groups:** Background layers (`background`, `layer-01..03`), Text (`text-primary/secondary/placeholder`), Borders (`border-subtle-01..03`, `border-strong-01..03`), Interactive (`interactive`, `focus`), Support (`support-success/warning/error/info`)
- **Density:** 4 levels — `compact` (24px) / `normal` (32px) / `spacious` (48px). Flat design (radius=0 across standard controls).

### ausos DS
- **Format:** CSS custom properties via `--a-*` prefix — semantic glassmorphism tokens
- **Key groups:** `--a-bg`, `--a-surface` (white-opacity glass layers), `--a-fg`, `--a-accent`, `--a-border`. Elevation via `backdrop-filter: blur()` + opacity, not drop shadows
- **Density:** Inherits Salt's 4-level scale (high/medium/low/touch)

### Rules
```
❌ NEVER use raw hex values: color: #1B7F9E;
❌ NEVER use arbitrary spacing: padding: 15px;
✅ ALWAYS use semantic tokens: color: var(--salt-palette-accent);
✅ ALWAYS use spacing tokens: padding: var(--salt-spacing-100);
```

---

## 2. Component Library

### Salt DS (57 components)
- **Package:** `@salt-ds/core` (production) + `@salt-ds/lab` (RC)
- **Architecture:** Composable — parent provides context, children are swappable
- **Key patterns:**
  ```tsx
  // Button: 3 appearances × 5 sentiments
  <Button sentiment="accented" appearance="solid">Label</Button>
  
  // Input: 3 variants + bordered prop
  <FormField validationStatus="error">
    <FormFieldLabel>Label</FormFieldLabel>
    <Input variant="primary" bordered={false} />
    <FormFieldHelperText>Error message</FormFieldHelperText>
  </FormField>
  
  // DatePicker: composable children
  <DatePicker>
    <DatePickerSingleInput />
    <DatePickerOverlay>
      <DatePickerSinglePanel />
      <DatePickerActions />
    </DatePickerOverlay>
  </DatePicker>
  ```
- **Appearances:** `solid` | `bordered` | `transparent` (NOT filled/outlined/text)
- **Sentiments:** `accented` | `neutral` | `positive` | `caution` | `negative`
- **Variants:** `primary` | `secondary` | `tertiary` (on Input, Card, Drawer, Panel, Table, Dropdown)
- Reference: `/mnt/skills/user/Salt/references/salt-components.jsx`

### Material 3 (30 sections)
- **Architecture:** Component + Container pattern
- **Key patterns:**
  ```tsx
  <Button variant="filled">Label</Button>   // filled | outlined | text | elevated | tonal
  <TextField variant="filled" error />       // filled | outlined
  <Card variant="filled">Content</Card>      // filled | elevated | outlined
  ```
- Reference: `/mnt/skills/user/UI Kit/references/m3-components.jsx`

### Fluent 2 (29 sections)
- **Architecture:** Compound components
- **Key patterns:**
  ```tsx
  <Button appearance="primary">Label</Button>  // primary | default | outline | subtle
  <Input appearance="underline" />              // underline | filled-darker | filled-lighter
  <Badge appearance="filled" color="brand" />
  ```
- Reference: `/mnt/skills/user/Fluent/references/fluent2-components.jsx`

### Carbon DS
- **Package:** `@carbon/react` + `@carbon/icons-react`
- **Architecture:** CSS-token-driven. Flat (radius=0), 2px focus outline, `$support-*` semantic palette
- **Key patterns:**
  ```tsx
  <Button kind="primary">Label</Button>  // primary | secondary | tertiary | ghost | danger | danger--primary | danger--tertiary | danger--ghost
  <TextInput labelText="Label" invalid invalidText="Error" />
  <Notification kind="error" title="..." subtitle="..." />
  ```
- Reference: `src/data/carbon/carbon-documentation.jsx`

### ausos DS
- **Package:** internal
- **Architecture:** Glassmorphism — white-opacity surfaces + backdrop-blur elevation. Aurora palette foundation
- **Key patterns:**
  ```tsx
  <button className="a-btn a-btn-primary">Label</button>
  <div className="a-surface" style={{ backdropFilter: "blur(12px)" }}>...</div>
  ```
- Reference: `src/data/ausos/ausos-documentation.jsx`

---

## 3. Frameworks & Libraries

| Layer | Technology |
|---|---|
| Framework | React 18+ / Next.js 16 (Design Hub host) |
| Language | TypeScript / JavaScript |
| Styling | CSS custom properties (all 5 systems use vanilla CSS variables) |
| Build | Next.js / Vite |

### Salt-specific
```tsx
import { Button, SaltProvider } from "@salt-ds/core";
import "@salt-ds/theme/index.css";

<SaltProvider density="medium" mode="light">
  <App />
</SaltProvider>
```

### Material-specific
```tsx
import { ThemeProvider, createTheme } from "@mui/material";
```

### Fluent-specific
```tsx
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
```

### Carbon-specific
```tsx
import { Button, TextInput } from "@carbon/react";
import "@carbon/styles/css/styles.css";
// Tokens live under `--cds-*` prefix after @carbon/styles is loaded.
```

### ausos-specific
```tsx
// Internal DS. Rendered via Design Hub's AUSOS_THEMES + ausosBuildCSS.
// No external provider; tokens are injected per preview.
```

---

## 4. Asset Management

- Images: Stored in `/public/assets/` or imported via bundler
- Icons: System-specific (see §5)
- Fonts: Loaded via Google Fonts CDN or self-hosted

---

## 5. Icon System

| System | Library | Count | Format |
|---|---|---|---|
| **Salt** | `@salt-ds/icons` | ~430 | React SVG components |
| **M3** | Material Symbols | 2,500+ | Variable font (Google Fonts CDN) |
| **Fluent** | `@fluentui/react-icons` | 4,000+ | React SVG, tree-shakeable |
| **Carbon** | `@carbon/icons-react` | 2,000+ | React SVG, tree-shakeable per-icon imports |
| **ausos** | Material Symbols | 2,500+ | Variable font — ausos piggybacks on M3's icon surface |

### Salt Icons
```tsx
import { SearchIcon, CloseIcon } from "@salt-ds/icons";
<SearchIcon size={1} />  // size multiplier: 1 = base, 2 = large
```

### M3 Icons
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
<span class="material-symbols-outlined">search</span>
```

### Fluent Icons
```tsx
import { Search24Regular, Search24Filled } from "@fluentui/react-icons";
<Search24Regular />
```

### Carbon Icons
```tsx
import { Search, Add, Settings } from "@carbon/icons-react";
<Search size={16} />  // 16 | 20 | 24 | 32
```

### ausos Icons
```html
<span class="material-symbols-outlined">search</span>
<!-- same font-based surface as M3; opacity adapts to glass surfaces -->
```

---

## 6. Styling Approach

### CSS Methodology
All five systems use **CSS custom properties** (design tokens). No CSS-in-JS required.

### Salt Styling Pattern
```css
/* Component uses characteristic tokens that resolve to palette → foundation */
.my-button {
  background: var(--salt-actionable-bold-background);
  color: var(--salt-actionable-bold-foreground);
  height: var(--salt-size-base);
  padding: 0 var(--salt-spacing-100);
  border-radius: var(--salt-curve-100);
  font-family: var(--salt-typography-fontFamily);
  font-size: var(--salt-text-fontSize);
}
```

### Responsive / Density
- **Salt:** Density applied via `SaltProvider density="high|medium|low|touch"` — all tokens auto-scale
- **M3:** Density offset via component prop `density={-1}` (each step = -4dp)
- **Fluent:** Size prop on components: `size="small|medium|large"` (intentional — Fluent 2 spec uses component size variants, not a global density scale)
- **Carbon:** Density tiers `compact` (24px) / `normal` (32px) / `spacious` (48px). 2px-based spacing scale. `medium` aliases to `normal` for cross-DS callers.
- **ausos:** Inherits Salt's 4-level density (high/medium/low/touch)

### Dark Mode
- **Salt:** `SaltProvider mode="dark"` — palette tokens auto-switch
- **M3:** Theme object swap (light/dark scheme); 6 variants (light, dark, plus medium- and high-contrast pairs)
- **Fluent:** `FluentProvider theme={webDarkTheme}`
- **Carbon:** Swap between `white` / `g10` / `g90` / `g100` themes (Design Hub exposes `jpm-light`/`jpm-dark`/`legacy-light`/`legacy-dark` overlays)
- **ausos:** Glass surfaces adapt; primary theme is dark by default (inverts to light via `AUSOS_THEMES.light`)
- **Rule:** Never hardcode dark-mode colors. All colors must come from tokens that auto-resolve.

---

## 7. Project Structure

```
src/
├── components/          # Shared UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.css
│   └── ...
├── features/            # Feature-specific modules
├── theme/               # Theme configuration
│   ├── tokens.css       # Custom token overrides
│   └── provider.tsx     # SaltProvider / ThemeProvider / FluentProvider
├── assets/
│   ├── icons/
│   └── images/
└── App.tsx
```

---

## Design Review Checklist

When translating a Figma design to code, verify:

### Tokens
- [ ] All colors use semantic tokens (no raw hex)
- [ ] All spacing uses system spacing tokens (no arbitrary px)
- [ ] All corner radii use system curve/shape tokens
- [ ] All typography uses system type scale (no arbitrary font-size)
- [ ] All shadows use system elevation tokens

### Components
- [ ] Correct prop names used (Salt: `solid`/`bordered`/`transparent`, NOT `filled`/`outlined`)
- [ ] Validation states implemented: error, warning, success, disabled
- [ ] Focus rings visible on Tab navigation (2px, contrast ≥3:1)
- [ ] Disabled state: reduced opacity, `pointer-events: none`

### Accessibility (WCAG 2.1 AA)
- [ ] Text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large ≥18px bold / ≥24px)
- [ ] Interactive element contrast ≥ 3:1
- [ ] Touch targets ≥ 44px (Salt Touch), ≥ 48dp (M3), ≥ 32px (Fluent)
- [ ] Keyboard navigation works for all interactive elements
- [ ] ARIA labels on icon-only buttons

### Dark Mode
- [ ] All tokens resolve correctly in dark mode
- [ ] Accent text readable on dark backgrounds (≥4.5:1)
- [ ] Borders/dividers visible
- [ ] Status colors (error/warning/success) remain readable
- [ ] Shadows increase opacity (Salt: 3-5×, Fluent: 2×)

### Density / Size
- [ ] Salt: verify H/M/L/T densities don't break layout
- [ ] M3: verify density offset (-1 to -3) renders correctly
- [ ] Fluent: verify S/M/L sizes are consistent
- [ ] Carbon: verify compact/normal/spacious tiers; `medium` alias resolves to `normal`
- [ ] ausos: verify H/M/L/T densities (inherits Salt scale)

---

## Common Violations & Fixes

| Violation | Fix |
|---|---|
| Raw hex `#1B7F9E` | → `var(--salt-palette-accent)` |
| `padding: 15px` | → `var(--salt-spacing-200)` (16px at medium) |
| `border-radius: 7px` | → `var(--salt-curve-100)` (4px at medium) |
| `font-size: 13px` | → `var(--salt-text-fontSize)` (12px at medium) |
| Button `appearance="filled"` | → Salt uses `appearance="solid"` |
| Missing validation states | → Add via `<FormField validationStatus="error">` |
| No focus ring | → `:focus-visible { outline: 2px solid var(--salt-palette-accent) }` |
| Shadow in M3 light theme | → Use tonal surface elevation, not drop shadow |
| Hardcoded dark colors | → Use semantic tokens that auto-switch per mode |

---

## Clarify-first (project-scoped)

Global rule applies: ask one clarifying question per turn, every request (incl. auto mode), until nothing is left to ask. Escape: `"just do it"` / `"go"` / `"ship it"`. Full checklist in `~/.claude/skills/clarify-first/SKILL.md`.

**Design-Hub-specific things to always clarify before building:**

- **Which design system is this block/page using?** Salt DS, Material 3, Fluent 2, Carbon DS, or ausos DS. Tokens and component names diverge across all five — don't assume.
- **Is this token-source work or block-level work?** Changes to `theme-next.css` / MD3 sys vars / Fluent design tokens / `--cds-*` / `--a-*` ripple everywhere; block-level styling is scoped. Ask before touching the token layer.
- **Cross-system intent:** if a new component is proposed, ask whether it should exist in all five systems eventually, even if only one is being implemented now.
- **Builder state vs. preview state:** clarify whether the change affects the Zustand builder state, the DnD surface, or only the rendered preview.
