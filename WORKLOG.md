# Design Hub — Work Log

## Project Overview
A Next.js 16 app with two main pages:
- **UI Kit** (`/`) — Interactive design system workbench for Salt DS, Material 3, and Fluent 2
- **AI Builder** (`/builder`) — AI chatbot interface for generating design system configurations

**Live:** https://shannonhecker.github.io/desinghub/
**Repo:** https://github.com/shannonhecker/desinghub

---

## Phase 1 — Foundation (Completed)

### 1.1 Initial Setup
- Next.js 16.2.3 with App Router, TypeScript, static export
- Deployed to GitHub Pages with `basePath: '/desinghub'`
- SSH key authentication for GitHub
- `.nojekyll` in deploy workflow to fix `_next/` asset loading

### 1.2 UI Kit (DesignHubApp)
- 3 design systems: Salt DS (57 components), Material 3 (30 sections), Fluent 2 (29 sections)
- Each system uses its own tokens for all UI rendering (buttons, inputs, cards, tables)
- Theme switcher with light/dark/custom modes per system
- Density controls (Salt: H/M/L/T, M3: 0/-1/-2/-3, Fluent: S/M/L)
- Tabs: Preview, Code, Tokens, Charts, Audit
- Zustand store: `useDesignHub`
- Highcharts integration (lazy module init to fix Turbopack production build)

### 1.3 Design System Audit
- Audited all 3 systems against official GitHub repos, Figma files, npm packages
- Fixed ~25 discrepancies in tokens, colors, component naming, and theme generation
- Files fixed: `salt-documentation.jsx`, `m3-documentation.jsx`, `fluent2-documentation.jsx`

---

## Phase 2 — AI Builder v1 (Completed)

### 2.1 Split-Screen Layout
- Left panel: chat + settings, Right panel: live preview
- Gradient/glow styling, glass morphism panels
- Design system selector, component chips, color overrides
- Download config JSON + simulated Push to Repo
- Zustand store: `useBuilder`

### 2.2 Routing
- Moved AI Builder to `/builder` route
- Restored UI Kit as main page (`/`)
- Added navigation links between pages:
  - UI Kit header: purple "AI Builder" button
  - Builder sidebar: "UI Kit Overview" link

---

## Phase 3 — AI Builder v2 (Completed — Current)

### 3.1 Minimal Chatbot Redesign
Inspired by Aris AI, Zyricon, and modern chatbot UIs.

**Orb Animations:**
- Multi-layer orb: sphere + glow ring + particle border + shimmer overlay
- 3 states: idle (gentle float), typing (pulse/scale), generating (energetic rotate)
- Conic gradient glow ring rotates continuously
- Dashed particle ring orbits slowly

**Simplified Sidebar:**
- Removed: feature nav, design system list, workspaces, upgrade card
- Kept: New Chat, History, Saved
- Added: Dark/Light theme toggle
- Added: UI Kit Overview link at bottom

**Chat Input:**
- Gradient glow border animates on focus/typing (purple → pink → cyan)
- Breathing pulse animation on the glow
- Glass morphism input box with backdrop blur

**Prompt Keyword Bubbles:**
- Replaced configuration panel entirely
- Bubbles: Salt DS, Material 3, Fluent 2, Dashboard, Landing Page, Form, Dark Mode, Light Mode, E-Commerce, Blog, Portfolio, Open Preview
- Hover: gradient glow + lift effect

**Animated Send Button (CTA):**
- Rotating conic gradient border (purple → pink → cyan)
- Inner radial gradient fill
- Scale-up on hover with glow shadow
- Spring-physics timing: `cubic-bezier(0.34, 1.56, 0.64, 1)`

**Preview:**
- Opens in new browser window instead of overlay panel
- Triggered by "Open Preview" bubble or typing "preview"

**Theme:**
- Dark: deep purple-black (#08070e) with atmospheric radial gradients
- Light: soft lavender (#f8f7fc) with subtle purple tints
- Toggle in sidebar switches instantly

---

## File Structure

```
src/
├── app/
│   ├── page.tsx              # UI Kit (DesignHubApp)
│   ├── builder/page.tsx      # AI Builder (BuilderApp)
│   ├── layout.tsx            # Root layout with fonts
│   ├── globals.css
│   └── global-error.tsx      # Error boundary
├── components/
│   ├── DesignHubApp.tsx       # UI Kit main component
│   ├── builder/
│   │   ├── BuilderApp.tsx     # AI Builder shell
│   │   ├── ChatPanel.tsx      # Hero view + chat view + input
│   │   ├── Sidebar.tsx        # Minimal sidebar
│   │   ├── SettingsPanel.tsx   # Config drawer (kept for future)
│   │   ├── PreviewPanel.tsx   # Preview content renderer
│   │   └── builder.css        # All builder styles
│   ├── ComponentPreview.tsx
│   ├── CodePanel.tsx
│   ├── TokenReference.tsx
│   ├── ChartsPage.tsx
│   └── AuditPanel.tsx
├── store/
│   ├── useDesignHub.ts        # UI Kit state
│   └── useBuilder.ts          # AI Builder state
├── data/
│   ├── registry.ts            # Design system data registry
│   ├── salt/                  # Salt DS documentation + themes
│   ├── m3/                    # Material 3 documentation + themes
│   └── fluent/                # Fluent 2 documentation + themes
public/
├── examples/
│   └── design-references.md   # Reference image descriptions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router) |
| Language | TypeScript |
| State | Zustand 5 |
| Styling | CSS custom properties + CSS-in-JS (inline) |
| Charts | Highcharts |
| Fonts | Inter, Open Sans, Roboto, Material Symbols |
| Build | Turbopack (dev) / static export (prod) |
| Deploy | GitHub Pages via Actions |

---

## Known Issues / Future Work

### Bugs
- Turbopack chunk caching can cause stale JS errors on GitHub Pages after deploy (hard refresh fixes)
- Preview tool (Claude Preview MCP) has connectivity issues with `basePath` in dev mode

### Enhancements (Phase 4 Ideas)
- [ ] Real AI integration (API call to Claude/OpenAI for actual code generation)
- [ ] Preview window renders actual generated code, not simulated layout
- [ ] Chat history persistence (localStorage or database)
- [ ] Saved chats functionality
- [ ] Export to Figma integration
- [ ] Voice input with Web Speech API
- [ ] Streaming text responses (token-by-token rendering)
- [ ] Mobile-optimized builder experience
- [ ] Orb responds to audio input amplitude
- [ ] Particle effects around orb (canvas-based)
- [ ] Typing animation on AI responses
- [ ] Drag-and-drop component arrangement in preview
