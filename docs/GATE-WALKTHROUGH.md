# Gate 3 / 4 Manual Walkthrough

Hands-on verification guide for the WCAG + builder-smoke checks the CI can't automate. Pairs with `docs/DESIGN-REVIEW.md`. Total time: **~20 min** for a full sweep.

Run this:
- Before merging any PR that touches `src/data/**/*-documentation.jsx`, `src/components/builder/**`, or changes focus/keyboard behavior.
- As a quarterly health-check on main.

## Prep (30 s)

```bash
cd ~/Documents/Cursor/Design-Hub
npm run dev   # keep running in one terminal
```

Open two browser windows:
1. **Chrome** (for DevTools + keyboard testing)
2. **Safari** + VoiceOver (for screen-reader verification)

---

## Part A — Keyboard-only navigation (10 min)

Goal: confirm every interactive element is reachable and usable with **Tab / Shift+Tab / Space / Enter / Arrow keys** only. No mouse.

### A.1 Salt pattern demos (highest new-code concentration)

Switch to **Salt DS** in the top bar. Then keyboard-walk these demos in sequence:

| Demo | Key sequence to try | Expected |
|---|---|---|
| **Checkboxes** | Tab through each checkbox → Space → Enter | Each toggles; Space AND Enter both work |
| **Radios** | Tab to group → Arrow Down/Right → ArrowUp/Left | Only ONE tab stop (the selected radio); Arrows cycle selection |
| **Pagination** | Tab through page buttons | `aria-current="page"` on active; "…" button announces "More pages" in SR |
| **PatListDetail** | Tab to list → Enter to select | Items respond to both click AND Enter/Space |
| **PatSettings tabs** | Tab to tab list → Enter to switch | Tabs focus; no dead zones |
| **PatWizard** | Tab to step indicator → Enter | Clicking step number jumps stages |
| **Toast / Tag / Drawer** | Find each close button | Close button focusable + labelled in SR |
| **Combobox** | Tab into input → type → Tab to list | Combobox input labelled; list items reachable |

### A.2 M3 keyboard checks

| Demo | Key sequence | Expected |
|---|---|---|
| **IconButtons** | Tab through | favorite/edit/notifications/star/more all labelled + `aria-pressed` state announces |
| **SearchBar** | Tab into input → type → Tab | Input has type="search", clear button labelled |
| **SegmentedButtons** | Tab into group → Tab through buttons | `role="group"` + aria-pressed per button |
| **Tabs (primary + secondary)** | Tab → Arrow Right/Left → Home/End | Roving tabindex — only selected tab focusable from outside |
| **Checkboxes + Radios** | Space / Enter / Arrows | Both keys toggle; Arrow keys cycle radios |
| **DatePicker** | Tab into prev/next chevrons → Tab into calendar | Month nav labelled; day cells have full-date aria-label |

### A.3 Fluent keyboard checks

| Demo | Key sequence | Expected |
|---|---|---|
| **Tabs** | Arrow Left/Right/Home/End | Roving tabindex; labelled tablist |
| **Links** | Tab through | Real anchors with href (no `preventDefault()` hacks) |
| **Switch toggle** | Tab → Space/Enter | Toggles; `aria-checked` updates |

### A.4 Carbon keyboard checks

| Demo | Key sequence | Expected |
|---|---|---|
| **SideNavDemo** | Tab through items | Each nav row is a `<button>`; active item has `aria-current="page"` |
| **Tabs** | Arrow Left/Right/Home/End | Full ARIA Tabs pattern |
| **Skip link** | Reload page → Tab once | "Skip to main content" link reveals; Enter routes focus to `#main-content` |
| **Modal** | Open → Tab | `aria-modal` + `aria-labelledby` wired to `<h2>` |
| **Login form** | Tab through fields | Autofill works (email + current-password); labels linked via `htmlFor` |

### A.5 ausos keyboard checks

| Demo | Key sequence | Expected |
|---|---|---|
| **Accordion** | Tab → Enter / Space | `aria-expanded` toggles; `aria-controls` wired |
| **Dropdown** | Tab to trigger → Enter → Arrow | Trigger has `aria-haspopup` / `aria-expanded`; options focusable + `role="option"` |
| **DatePicker** | Tab through prev/next + day cells | Full-date aria-label announces on each cell |
| **Switches (Dark mode / Notifications)** | Tab → Space | `aria-labelledby` linked to sibling text |
| **Alerts** | None (no interaction) | On page load, SR announces: "New update available. Changes saved successfully. API rate limit approaching. Connection failed" (the `aria-live` regions) |

---

## Part B — VoiceOver screen reader (7 min)

Open Safari. Turn on VoiceOver: **⌘F5** (or **fn+⌘F5** on keyboards without F-row). Use **Ctrl+Option+Arrow** to navigate.

### B.1 M3 critical surfaces

Navigate to M3, then through each of these demos with VoiceOver. Confirm SR announcements include what's in quotes:

- **SearchBar** → "Search Material Design, edit text" (visually hidden label was applied); typing should not re-announce placeholder.
- **SegmentedButtons** → "Day, tab, 1 of 3, selected" OR "Day, button, 1 of 3, group, Time range" — the `role="group"` + aria-label should announce.
- **DatePicker** → Navigate through day cells. "April 15, 2026, button, selected" — full date from Intl.DateTimeFormat.
- **IconButtons** → "Favorite, button, pressed" — no "favorite" leaking twice (the `<I>` icon now has `aria-hidden="true"`).
- **Progress bar** → "Determinate progress, progress bar, 47%" — aria-valuenow works.

### B.2 Live regions

- **M3 Snackbars demo** → triggering (by clicking something elsewhere) should cause SR to speak "Photo saved" / "Conversation archived".
- **ausos Alerts** — on first landing on the Alerts demo, all 4 alerts should announce once (polite for info/success, assertive for warning/danger).
- **Salt Banners** — same: 4 banners announce on demo mount.
- **Salt Loading chip** — "Loading, status" should be spoken when visible.

### B.3 Form autofill (password managers)

In Safari / 1Password:
- **Carbon PatLogin** — Email field should trigger email-autofill suggestion; Password field should trigger password-manager suggestion.
- **Salt login demo** — Same check.
- **M3 DensityTokens email input** — type="email" + autoComplete="email" → email-autofill works.

---

## Part C — Carbon builder smoke (3 min)

Critical: sprint 2525492 features. Any Carbon-touching PR must confirm these.

Switch to Carbon, open the builder canvas (any block drag-in).

| Feature | Test | Expected |
|---|---|---|
| **Multi-select** | Drag 3 blocks in; Cmd+click 2 of them | Both show selection outline |
| **Group-as-column** | With 2+ selected, right-click → Group as column | Blocks wrap into a column container |
| **Right-click menu** | Right-click any block | Menu appears with duplicate / delete / group / ungroup |
| **Shortcuts** | Cmd+D (duplicate) / Delete (delete) / Cmd+G (group) | All keyboard shortcuts fire their action |

If any of these break after a PR touches `src/components/builder/` or `src/store/useDesignHub.ts`, revert the PR — sprint 2525492 is protected.

---

## Part D — Reduced motion (1 min)

1. System Preferences → Accessibility → Display → **Reduce motion** ON
2. Reload Design Hub
3. Switch through all 5 DS
4. **Expected:** Animations play at 0.01ms (effectively instant). No keyframe animations run. Everything still looks right, just doesn't move.

This is specifically covered by:
- Per-DS `@media (prefers-reduced-motion: reduce)` in each DS's buildCSS
- Carbon's explicit animation-name: none !important on spin/pulse/drawer keyframes

---

## Part E — Dark-mode contrast spot-check (1 min)

Install the **WAVE** or **axe DevTools** Chrome extension if not already.

1. Switch each DS to its dark theme (M3 dark, Carbon g100, Fluent dark, Salt jpm-dark, ausos dark)
2. Run axe on a representative component (any button + any text field)
3. **Expected:** 0 contrast errors. Warnings on borderline cases OK — document them in the PR.

---

## Output format

After running this, paste your findings into the PR under "Gate evidence" using this template:

```markdown
### Gate 3/4 walkthrough — <date>

**Keyboard (Part A):** <✓ / issues found>
**VoiceOver (Part B):** <✓ / issues found>
**Builder smoke (Part C):** <✓ / issues found — if PR touched builder>
**Reduced motion (Part D):** <✓ / issues found>
**Dark-mode contrast (Part E):** <✓ / issues found>

**Issues to follow up (not blocking merge):**
- …
```

---

## Escape hatches

- **Skip when a PR is pure-docs or pure-tokens:** Part C (builder smoke) and Part D/E (motion + contrast) are optional.
- **Skip Part B when no net new interactive element:** If the PR only refactors existing a11y wiring without introducing new SR-announced content, Part B is optional.
- **No walkthrough for emergency hotfixes:** Log "skipped — emergency hotfix, walkthrough deferred to follow-up" in the PR body, and file a tracking issue.
