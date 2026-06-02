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

## Phase 4 — Builder Templates & Chatbot Flow (In Progress)

> Note: this log skipped several intervening builder / template / onboarding releases (tracked in PRs #200+). Resuming here from 2026-06-02.

### 4.1 Landing Page template + full-width support — 2026-06-02
Branch `builder-marketing-templates`, commit `0365c1c`.
- **Full-width layouts:** `showSidebar` now gates on `sidebarBlocks.length > 0`, so marketing pages with no sidebar render full-width instead of showing an empty rail. Dashboards keep their sidebar; dropping a sidebar block re-shows it. (`PreviewPanel.tsx`)
- **Landing Page template** (`interfaceType: "landing"`, id `"landing-page"`): top nav (brand + links + CTA) → hero with email capture + image → feature trio → social-proof stats → growth chart → pricing → closing CTA → footer. Built from existing blocks + tokens; structure from the Finpay reference. Registered in `VALID_TEMPLATE_IDS` / `BUILDER_TEMPLATES` / `TEMPLATE_ORDER` + `interfaceTypeToTemplateId("landing")`. (`builderTemplates.ts`, `wizardFlow.ts`)
- **Drawer thumbnail:** added `LandingPagePreview` SVG wireframe to `TemplatePreviews.tsx`.
- **Recovery note (Mac crash):** the local verify build (`bihjuok7z`) was killed by a system crash mid-typecheck, so the commit pushed before the failure surfaced. The Vercel preview build then errored: `PREVIEWS: Record<TemplateId, React.FC>` was missing the `landing-page` key. Fixed by adding `LandingPagePreview`. **Lesson:** a new `TemplateId` must be wired into every exhaustive map AND the (un-typed) block renderers — `tsc` only catches the explicitly-typed `Record<TemplateId, …>` maps, not switch defaults, untyped lookups, or per-block render branches.

### 4.2 Chatbot flow polish — QUEUED (needs reference images #8–#11)
Owner ask 2026-06-02; blocked on the 4 screenshots being re-shared.
- [ ] **Hover treatment:** current state shows an underline + the element growing taller on hover — reads as odd. Replace with a better-considered treatment.
- [ ] **Stepwise setup:** when "set it up step by step" is chosen, the step UI should *replace* the chatbox (guided-in-chat), not sit alongside it.
- [ ] **Templates as in-chat cards:** selecting a template should render the choices as cards *inside the chat thread* (chat format), with the composer pinned to the bottom — not a separate drawer.
- [ ] Reference patterns to mine: Claude, Codex, Gemini, v0, Lovable, Replit (research done 2026-06-02 — synthesis below).

**Research synthesis** (Claude / ChatGPT Apps SDK / Gemini / Copilot / v0 AI-Elements / Lovable / Replit / Bolt):
- **Hover/focus (the odd treatment):** drop the underline + the literal height-grow (it reflows neighbors and reads jumpy). Standard fix: keep the box height fixed and let a *group-owned* ring carry focus. v0/AI-Elements wraps shadcn `InputGroup` so the GROUP owns `border-ring + ring-[3px] ring-ring/50` while the inner field is ringless; Fluent 2 = thicker focus *stroke*, fill unchanged. Chips → `rounded-full` outline pills; hover = subtle fill-darken (not underline, not scale); focus = same ring. Token it so it themes across Salt/M3/Fluent. ≥4.5:1 in every state.
- **Stepwise setup (replace the chatbox):** do NOT delete the free-text input. Put a "Set it up step by step" toggle *inside* the composer (Replit Plan-mode, Lovable Plan, Bolt Plan/Discuss). It re-frames the same input into a guided flow with a structured control per step (DS = 3-up segmented, density = segmented/slider, blocks = chips), a "Step 2 of 4" stepper, then an editable plan with an **Accept / Revise gate** before generating. After generation, fall back to free-text iteration. Dual-mode (structured + freeform coexist), never a rigid wizard lock.
- **Templates as in-chat cards (composer at bottom):** render template/starter choices as INLINE cards/carousel in the thread with the composer pinned to the bottom — unanimous across OpenAI Apps SDK, v0 AI-Elements (Plan/Confirmation cards), Copilot Adaptive Cards, Replit output-type carousel. Card spec: header (label+icon) / preview / MAX TWO actions ("Use this" + "Customize"); no tabs or nested scroll; 3–8 per carousel. Reserve a separate fullscreen surface only for genuine multi-step builds.
- **Composer (cross-cutting):** always bottom-docked; centered only on the empty state, then drops to bottom on first message (one component, two positions). Mode/action controls live *inside* the composer footer, not a top toolbar. Streaming = in-place shimmer, never a layout change.
- **Watch-out:** Gemini removing visible chips hurt discoverability — if chips leave the bar, replace that discoverability (empty-state starter-card feed, or in-response follow-ups).

### 4.3 Floating / collapsible chat in edit + preview mode — QUEUED (owner ask 2026-06-02)
Once past onboarding and actively building, the 3-panel layout (chat + canvas + inspector) is too squashed, and the chat is no longer the primary action — the canvas is. So:
- [ ] In **edit + preview** mode, detach the composer from its fixed panel and make it **float** over the canvas.
- [ ] Let it **collapse to a corner** (FAB-style bubble), expandable on demand, freeing the squashed panel space for the canvas/inspector.
- [ ] Keep onboarding / empty state with the chat centered as the primary surface (per 4.2); float + collapse applies only once editing begins.
- **Relation:** extends the 4.2 composer work (the "composer position by workflow depth" finding: center-stage when chat is primary, demoted once the canvas is). Design alongside the chatbot-polish plan.
- **Design Qs for the build pass:** which corner + default state (collapsed vs expanded); whether "preview" here means the side-by-side preview within edit vs present mode (already chat-free); keyboard access + reduced-motion for the collapse; does it dock/undock or always float.
- **Status 2026-06-02:** SHIPPED as a corner re-open FAB (PR #246) leveraging the existing `chatOpen`/`toggleChat` collapse; full float-over-canvas overlay deferred as optional. (4.1 #241, hover #242, 4.2 cards #244, 4.3 stepwise #245 + FAB #246 all merged + live.)

### 4.4 Component / config panel — QUEUED (owner ask 2026-06-02; "all three, sequenced")
The config-panel editing path is pillar #1's other input mode (the prompt side shipped as 4.2). Three sub-items:
- [ ] **4.4a Polish the panel UX** — spacing, grouping, hover/focus consistency (reuse the unified pill treatment from #242), discoverability, search.
- [ ] **4.4b Config-panel editing as a peer to prompt** — make "edit from the configuration panel" a first-class input mode alongside chat, same realtime preview.
- [ ] **4.4c Real DS components in the panel** — the panel lists + inserts the REAL official DS components (not Simulated*), so what you drag in matches what exports. **Depends on Phase 5.**

### 4.5 In-chat template gallery — discoverability — SHIPPING 2026-06-02
The PR-2 in-chat card carousel cut cards off (CRM half-clipped) with no affordance (hidden scrollbar, no arrows), so users couldn't tell there were more templates. Rethought per carousel best practice (NN/g, Smashing): keep the carousel + add **left/right arrow buttons**, **edge-fade gradients**, **scroll-snap**, and the existing **peek** of the next card, so every template is reachable and obviously-more. Arrows hide at each end; reduced-motion guarded. Alternative considered: a wrap-grid (all visible at once) — deferred per owner's arrow suggestion.

---

## Phase 5 — Real DS API (goal pillar #5 + #4) — PLAN (5-agent audit, 2026-06-02)

**Goal:** every component / token / pattern from the real official DS API; download runnable code / SVG / Figma; UI Kit + builder share one source.

**Audit verdict (current state):**
- **Export = REAL, largely met.** `reactExporter` is registry-first (`componentApiRegistry.blockToRealJsx` + `collectImports`) → emits real `@salt-ds` / `@mui` / `@fluentui` / `@carbon` imports + JSX, with an *honest* generic-markup fallback (no fabricated APIs). Coverage 89.7% (175/195 block×DS): M3/Fluent 95%, Salt 92%, uoaui 87%, Carbon 79%. React + Vite exports build-runnable; charts emit runnable Highcharts.
- **Live preview = SIMULATED.** `ComponentRenderer.tsx` renders ~43 `Simulated*` placeholders (CSS-class mimics + `--ds-*` tokens), NOT the installed packages. The registry's `toJsx` emits **strings** (code), so it can't directly render elements.
- **UI Kit (route /) renders REAL components** (`getDemoComponent` from `src/data/<ds>/*-documentation.jsx`) but is INDEPENDENT of the registry — so "UI Kit + builder share code" isn't yet true.
- Packages installed: Salt, MUI, Fluent, `@carbon/styles`. **Missing: `@carbon/react`.**

**Plan (by leverage / risk):**
- [ ] **P5.1 Install `@carbon/react`** (quick, low-risk): pins the version so exported Carbon projects npm-install cleanly; prepares preview-real-render.
- [ ] **P5.2 Close registry coverage gaps** where real components exist (Carbon Avatar/Title/…, uoaui); audit uoaui `.a-*` class surface vs the actual stylesheet.
- [ ] **P5.3 Preview renders real DS components** (the defining gap, HIGH-RISK architecture). Options: (a) iframe / shadow-DOM scoping to contain Fluent/Carbon global CSS resets + avoid hydration mismatch; (b) a parallel element-renderer (block → real React element) shared by builder preview AND UI Kit. **Owner decision needed.**
- [ ] **P5.4 UI Kit ↔ registry bridge** (the "shared code" pillar) — both surfaces consume one source. Depends on P5.3.
- Pin `@salt-ds/lab` in the vite exporter VERSION_MAP (currently "latest"); Figma export requires Preview mounted (guard).

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

---

## Session Log — 2026-06-02 (Goal push: realistic 5-DS builder)

> NOTE: this app is now **5 design systems** (Salt, Material 3, Fluent 2, Carbon, uoaui), deployed on **Vercel → uoaui.ai** (the "3 DS / GitHub Pages" notes above are stale). Studio login `Dog6621`.

**North-star goal (`/goal`, Stop-hook enforced):** a realistic UI builder that competes with Canva-class tools, using 5 design systems with REAL components + patterns; users can download OR share ready-to-use code; the UI Kit page should feel like a Google Material / Microsoft Fluent design-system website.

### Owner asks (every request this session, with status)

| # | Ask | Status |
|---|---|---|
| 1 | Floating chat over canvas — float, but user can also **dock/pin to the side** | ✅ SHIPPED #251 (chatMode floating\|docked + .chat-float card + dock toggle + FAB) |
| 2 | Component-panel polish (4.4a) | ⚠️ #253 shipped token/focus/hover/search-count — but it was mostly *invisible*; did NOT fix the visible UX → superseded by ask #8 |
| 3 | Templates "not realistic enough" → realism | ✅ SHIPPED #259 (real data + stock images across all 5 templates; area-chart now honours real series) |
| 4 | Dummy-data + **images library** (ready-to-load) | ✅ SHIPPED #252 (sampleData + 33 HTTP-verified stock images) + #256 stock-image **picker** |
| 5 | Merge authority: "can merge as long as tested + visually confirmed" | ✅ operating model (carve-outs: rules-class files, em-dashes, unverifiable) |
| 6 | "use /workflow to run all the task and plan" | ✅ planning workflow → 17-PR conflict-aware plan; per-item implement workflows |
| 7 | Stock images "for user to pick from" | ✅ SHIPPED #256 (categorized picker: Product/People/Office/Nature/Abstract + paste-URL); source = curated free-license hotlinked (no API key, exports resolve anywhere) |
| 8 | Component panel **search icon outside the input box** + **grouping hard to find things** → make it **useful** w/ UI/UX + front-end skills + **online best-practice research** | 🔄 IN PROGRESS — root cause found (icon anchors to padded sticky-bar edge, not the input); research+audit+redesign-spec workflow running; branch `fix/panel-search-icon-grouping` |
| 9 | Floating chat → **moveable anywhere** + collapse to corner + **dock anywhere** + expand when docked + **popup when user clicks "ready to generate / build it"** | ⏸ QUEUED (task) — evolves item 1 into the moveable-window model + dock zones + build-trigger |
| 10 | Template **padding too big**, not like a real usable website/app → **online competitor analysis first**, then a thought-through **plan** | ⏸ QUEUED (task) — targets structurePadding S/M/L + per-DS native values + --dh-pad-canvas/zone/block/gap; plan-first |
| 11 | "after all above done run a **user-test + code review + design audit** again" | 🔄 RUNNING — read-only QA workflow (correctness, failures/security, export-build-all-5-DS, design-audit, a11y, 3-persona user-test) → synthesize → FIX P0/P1 |
| 12 | "capture all the ask into work log" | ✅ this entry |
| 13 | Component panel **token audit** + "some text feels out of space" | 🔄 folded into the panel redesign (run `tokens:audit` + grep hardcoded values + text-spacing pass before merge) |
| 14 | Component panel **research-grounded REDESIGN** — make it useful (search-in-box + scannable groups + recents) | 🔄 IN PROGRESS — best-practice research done; building (decisions locked: recents✓, sticky headers✓, all-open+collapse-all✓) |
| 15 | Template **density** — too padded vs real apps; competitor analysis + plan | ✅ PLAN APPROVED (Stripe-moderate / redefine 'medium' / defer landing hero) — implementing after panel (key fix: `--dh-pad-canvas` was injected-but-unused; tighten uoaui+M3 only) |
| 16 | **Sessions never save** (drawer always empty) — research how AI chats store conversations + fix | 🔄 diagnose+research workflow running → plan → fix (likely localStorage/IndexedDB-first, no-auth) |
| 17 | Chatbox as **conversational user-guide** — explain what the tool is / how it works + refer users to the UI Kit site | ⏸ QUEUED (task) — chat system-prompt + intent handling + /ui-kit link affordance |

### Shipped this session — 11 PRs (main 1e09b4d → ddfc719)
- #251 floating chat + dock/pin · #252 sample-data + stock-image library · #253 component-panel polish (tokens/focus/hover/search-count) · #254 ui-kit-meta data backbone · #255 export-verify harness (salt+uoaui exports build green) · #256 stock-image picker · #257 premium gallery cards (tall thumbnail) · #258 uoaui live real-render · #259 realistic templates · #260 premium component-detail page (right-rail TOC + variants matrix + all-5-DS props + guidance + token swatches) · #261 Carbon live real-render (scoped @carbon/styles) → **5/5 DS render real**.

### Deferred / not-yet-built
- Ask #8 panel redesign (in flight), #9 moveable-window chat, #10 template density, #11 closing-QA P0/P1 fixes.
- W7-P2 LayoutGroup export recursion fix; W6-P3 extended-block coverage (salt/m3/fluent beyond the 5 core blocks).

### Key engineering notes (this session)
- **Parallel-agent race** fires even across git worktrees here → run implementer agents ONE AT A TIME; each commits then verifies via `git show <sha>:<file>` (not the working tree); scope-check every PR's file list before merge.
- **lightningcss**: author `backdrop-filter` UNPREFIXED only (a presentStage test fails on the `-webkit-` + standard pair).
- Headless chromium can't load the Google-hosted Material Symbols font (icons render as ligature text) and the /builder component-library rail sits behind an onboarding gate → verify visuals on `/ui-kit` (no gate) or the Vercel preview with the `x-vercel-protection-bypass` header.
- Carbon live-render needs build-time scoped CSS (postcss prefix-wrap to `.carbon-live-scope`) — the runtime CSS-scoper that worked for uoaui can't apply since Carbon ships a static stylesheet, not a JS generator.
