# Builder canvas-gesture E2E suite

Playwright regression tests for the builder canvas. Scoped to add / drag / resize / reorder / group / remove gestures so a regression in dnd-kit, the resize HUD, or the keyboard-shortcut layer is caught before it hits a usability participant or a production user.

## Run locally

```bash
# 1. Make sure the dev server is up (in another terminal):
npm run dev

# 2. Run the suite once:
npx playwright test

# 3. Headed (for debugging):
npx playwright test --headed

# 4. UI mode (interactive trace viewer):
npx playwright test --ui
```

## Auth: STAGING_PASSWORD

`src/middleware.ts` gates `/builder` behind a password if `STAGING_PASSWORD` is set in env. The suite handles both modes:

- **Public mode** (no `STAGING_PASSWORD`) — tests run directly against `/builder`. No auth setup needed.
- **Password mode** — `e2e/auth.setup.ts` POSTs `STAGING_PASSWORD` to `/api/staging-login` and persists the resulting cookie to `playwright/.auth/user.json`. All tests reuse that storage state.

The suite reads `.env.local` automatically (see `playwright.config.ts:8–18`) so `npx playwright test` works without manually exporting env vars when developing locally.

For CI: set `E2E_STAGING_PASSWORD` (preferred — keeps test secret separate from runtime secret) or `STAGING_PASSWORD` in the workflow's env.

## Coverage

Active (running):

- Builder loads with chat input visible
- Top bar exposes UI Kit / Export / New session
- Local-command path: "build a dashboard" populates canvas
- ⌘Z undoes the last canvas mutation

Marked `test.fixme` (placeholder for follow-up):

- Library-tile click adds a block
- Right-click menu offers Delete + Wrap in group column
- Delete key removes a selected block
- Drag library tile to canvas (dnd-kit pointer-event simulation)
- Resize handle drag changes block width
- Shift-click multi-select + ⌘G groups blocks

## Why so many fixmes?

dnd-kit uses raw pointer events with a 10px activation threshold (`ComponentLibrary.tsx:67`). Playwright's `dragAndDrop` helper emits HTML5 drag events, which dnd-kit doesn't listen to. Each gesture needs hand-rolled `page.mouse.move/down/up` sequences calibrated to the activation threshold. Doing all of them well in one PR would balloon scope; the scaffold here proves the framework + auth works, and each fixme is a focused follow-up.

Order to pick them off (recommended):

1. **Library-tile click** — easy, no drag simulation. Validates the panel is mounted and tile labels are stable.
2. **Right-click menu** — `page.locator(...).click({ button: "right" })`. Validates BlockContextMenu wiring.
3. **Delete key** — keyboard, no DnD. Validates `useBuilderShortcuts.ts:42–50`.
4. **Drag from library** — first DnD test; hand-rolled mouse sequence. Calibrate, then duplicate the helper for the rest.
5. **Resize** — uses the same mouse helper + assertion on live HUD overlay text.
6. **Multi-select + ⌘G** — chain shift-click + keyboard.

## Trace + screenshots

On failure: `test-results/<test-name>/test-failed-1.png` + `video.webm` are produced. View traces with:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

The HTML report lives in `playwright-report/`; open `index.html` after a run.

## What this suite is not

- **Not a usability study.** Real-user friction lives in the moderated study (see `~/.claude/plans/act-as-service-desinger-adaptive-elephant.md`).
- **Not WCAG conformance.** The Gate 3/4 walkthrough (`docs/GATE-WALKTHROUGH.md`) covers that manually.
- **Not visual regression.** Screenshots on failure only, no Percy/Chromatic. Add a separate visual suite if you need pixel-diff guarantees.

## CI integration (not yet wired)

Recommended GitHub Actions step:

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E
  env:
    E2E_STAGING_PASSWORD: ${{ secrets.E2E_STAGING_PASSWORD }}
    STAGING_TOKEN_SECRET: ${{ secrets.STAGING_TOKEN_SECRET }}
    CI: true
  run: npx playwright test --reporter=github,html

- name: Upload Playwright report on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

`webServer` in `playwright.config.ts` boots `npm run dev` on CI so no separate server step is needed.
