---
description: 
alwaysApply: true
---

# Design System Rules — Figma-to-Code Integration

This document defines the design system rules for translating Figma designs into production code. It covers three supported design systems: **Salt DS** (J.P. Morgan), **Material 3** (Google), and **Fluent 2** (Microsoft).

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

---

## 3. Frameworks & Libraries

| Layer | Technology |
|---|---|
| Framework | React 18+ |
| Language | TypeScript / JavaScript |
| Styling | CSS custom properties (all 3 systems use vanilla CSS variables) |
| Build | Vite / Webpack |

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

---

## 6. Styling Approach

### CSS Methodology
All three systems use **CSS custom properties** (design tokens). No CSS-in-JS required.

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
- **Fluent:** Size prop on components: `size="small|medium|large"`

### Dark Mode
- **Salt:** `SaltProvider mode="dark"` — palette tokens auto-switch
- **M3:** Theme object swap (light/dark scheme)
- **Fluent:** `FluentProvider theme={webDarkTheme}`
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
