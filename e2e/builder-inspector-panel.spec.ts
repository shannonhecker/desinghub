import { test, expect, type Page } from "@playwright/test";

/**
 * The inspector panel (the right-hand "component configuration" panel in Edit
 * mode) keeps one layout language and predictable interaction:
 *
 *   1. One inset: every label and control starts on the same left line and
 *      ends on the same right line (within 1px), across block types.
 *   2. One rhythm: consecutive fields in a section are 12px apart (the
 *      --insp-gap-field token); nothing is stacked with a zero gap.
 *   3. Nothing overflows sideways, and a segmented control never runs past
 *      its container.
 *   4. Plain names: the title names the block, the sections are plain words.
 *   5. Selecting a block does not move the canvas: the device frame and its
 *      blocks keep their rects before and after a selection.
 *   6. The floating block toolbar never covers another block.
 *   7. Interaction: Escape inside a field leaves the field and keeps the
 *      selection; Escape on the canvas clears it. Arrow keys step a number
 *      field. A typed edit is one undo step. A collapsed section stays
 *      collapsed when the selection changes.
 *
 * Pre-flight: a server at E2E_BASE_URL (see playwright.config.ts).
 */

const INSET = 16;
const FIELD_GAP = 12;

async function openAnalyticsInEdit(page: Page) {
  await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
  await expect(page.locator(".component-sidebar")).toBeVisible();
  await page.waitForTimeout(600);
}

async function select(page: Page, prefix: string) {
  const block = page.locator(`[data-block-id^="${prefix}"]`).first();
  await block.focus();
  await block.press("Enter");
  await expect(page.locator(".inspector-stack")).toBeVisible();
}

async function expandAll(page: Page) {
  for (let round = 0; round < 4; round++) {
    const closed = page.locator('.component-sidebar .inspector-section-head[aria-expanded="false"], .component-sidebar .inspector-subgroup-head[aria-expanded="false"]');
    if ((await closed.count()) === 0) break;
    await closed.first().click();
  }
}

/** Measures every label and control in the panel relative to the panel's edges. */
async function panelRows(page: Page) {
  return page.locator(".component-sidebar").evaluate((aside) => {
    const a = aside.getBoundingClientRect();
    const rowSel = ".inspector-section-body > .inspector-field, .inspector-section-body > .inspector-field-row, .inspector-section-body > .inspector-section-scope, .inspector-subgroup-body > .inspector-field, .inspector-subgroup-body > .inspector-field-row";
    const parents: Element[] = [];
    const rows = [...aside.querySelectorAll(rowSel)].map((el) => {
      const r = el.getBoundingClientRect();
      const p = el.parentElement as Element;
      if (!parents.includes(p)) parents.push(p);
      /* The parent's identity (not its class: every section body shares one). */
      return { text: (el.textContent ?? "").trim().slice(0, 30), left: r.left - a.left, right: a.right - r.right, top: r.top - a.top, bottom: r.bottom - a.top, parent: String(parents.indexOf(p)) };
    });
    const heads = [...aside.querySelectorAll(".inspector-section-head, .inspector-subgroup-head")].map((el) => {
      const r = el.getBoundingClientRect();
      return { text: (el.textContent ?? "").trim().slice(0, 30), left: r.left - a.left, right: a.right - r.right };
    });
    const segs = [...aside.querySelectorAll(".inspector-toggle-group")].map((g) => {
      const r = g.getBoundingClientRect();
      const p = (g.parentElement as HTMLElement).getBoundingClientRect();
      return { right: a.right - r.right, insideParent: r.right <= p.right + 0.5 && r.left >= p.left - 0.5, scrollW: g.scrollWidth, clientW: g.clientWidth };
    });
    const stack = aside.querySelector(".inspector-stack") as HTMLElement | null;
    const body = aside.querySelector(".lib-body") as HTMLElement | null;
    const sr = (stack ?? aside).getBoundingClientRect();
    const offenders = stack ? [...stack.querySelectorAll("*")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > sr.right + 0.5 || r.left < sr.left - 0.5 || el.scrollWidth > el.clientWidth + 1); }).map((el) => `${(el.className || el.tagName).toString().slice(0, 40)} right+${Math.round(el.getBoundingClientRect().right - sr.right)} sw${el.scrollWidth}/cw${el.clientWidth}`).slice(0, 6) : [];
    return {
      rows,
      heads,
      segs,
      offenders,
      overflow: Math.max(stack ? stack.scrollWidth - stack.clientWidth : 0, body ? body.scrollWidth - body.clientWidth : 0),
      title: aside.querySelector(".lib-header-title")?.textContent ?? "",
      sections: [...aside.querySelectorAll(".inspector-section-title-text")].map((e) => e.textContent ?? ""),
    };
  });
}

const BLOCKS: Array<[string, string, string]> = [
  ["stat card", "tpl-ad-kpi-1-", "Stat card"],
  ["area chart", "tpl-ad-hero-", "Area chart"],
  ["donut", "tpl-ad-chart-3-", "Donut chart"],
  ["data table", "tpl-ad-table-", "Data table"],
  ["dropdown", "tpl-ad-range-", "Dropdown"],
  ["title", "tpl-ad-title-", "Title / heading"],
];

test.describe("inspector panel layout", () => {
  for (const [name, prefix, title] of BLOCKS) {
    test(`${name}: one inset, one rhythm, no overflow, plain names`, async ({ page }) => {
      await openAnalyticsInEdit(page);
      await select(page, prefix);
      await expandAll(page);
      await page.waitForTimeout(300);
      const m = await panelRows(page);

      expect(m.title, "panel title names the block").toBe(title);
      expect(m.sections[0], "first section is Content").toBe("Content");
      for (const s of m.sections) expect(s, "no code names").not.toMatch(/Properties|Simulated|Highchart/);

      expect(m.overflow, `no horizontal overflow (${m.offenders.join("; ")})`).toBeLessThanOrEqual(0);

      for (const h of m.heads) {
        expect(Math.abs(h.left - INSET), `head "${h.text}" left inset`).toBeLessThanOrEqual(1);
        expect(Math.abs(h.right - INSET), `head "${h.text}" right inset`).toBeLessThanOrEqual(1);
      }
      for (const r of m.rows) {
        expect(Math.abs(r.left - INSET), `row "${r.text}" left inset`).toBeLessThanOrEqual(1);
        expect(Math.abs(r.right - INSET), `row "${r.text}" right inset`).toBeLessThanOrEqual(1);
      }
      for (const s of m.segs) {
        expect(s.insideParent, "segmented control inside its container").toBe(true);
        expect(s.scrollW, "segmented control does not scroll").toBeLessThanOrEqual(s.clientW);
      }
      /* Consecutive rows in the same section body are one field gap apart. */
      let checked = 0;
      for (let i = 1; i < m.rows.length; i++) {
        const prev = m.rows[i - 1];
        const cur = m.rows[i];
        if (prev.parent !== cur.parent) continue;
        if (cur.top < prev.bottom) continue; /* a different column, not a stack */
        expect(Math.abs(cur.top - prev.bottom - FIELD_GAP), `gap before "${cur.text}"`).toBeLessThanOrEqual(1);
        checked++;
      }
      expect(checked, "measured at least one field gap").toBeGreaterThan(0);
    });
  }
});

test("selecting and deselecting a block does not move the canvas", async ({ page }) => {
  await openAnalyticsInEdit(page);
  const rects = () => page.evaluate(() => {
    const frame = document.querySelector(".bp-device-frame") as HTMLElement;
    const f = frame.getBoundingClientRect();
    const b = [...document.querySelectorAll(".bp-main [data-block-id]")].slice(0, 6).map((el) => {
      const r = el.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map((n) => Math.round(n));
    });
    return { zoom: frame.getAttribute("data-frame-zoom"), f: [f.x, f.y, f.width].map((n) => Math.round(n)), b };
  });
  const before = await rects();
  await select(page, "tpl-ad-kpi-1-");
  await page.waitForTimeout(400);
  expect(await rects()).toEqual(before);
  await select(page, "tpl-ad-hero-");
  await page.waitForTimeout(400);
  expect(await rects()).toEqual(before);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  expect(await rects()).toEqual(before);
});

test("the block toolbar never covers another block", async ({ page }) => {
  await openAnalyticsInEdit(page);
  for (const prefix of ["tpl-ad-kpi-1-", "tpl-ad-hero-", "tpl-ad-chart-3-", "tpl-ad-title-"]) {
    await select(page, prefix);
    await page.waitForTimeout(300);
    const hits = await page.evaluate(() => {
      const chrome = [...document.querySelectorAll(".hover-inspector .canvas-block-handle, .hover-inspector .canvas-block-remove, .hover-inspector .canvas-block-swap, .hover-inspector-toolbar")];
      const selId = document.querySelector("[data-inspector-block-id]")?.getAttribute("data-inspector-block-id");
      const blocks = [...document.querySelectorAll(".bp-main [data-block-id], .bp-header [data-block-id], .bp-footer [data-block-id]")];
      const out: string[] = [];
      for (const c of chrome) {
        const r = c.getBoundingClientRect();
        if (!r.width) continue;
        for (const b of blocks) {
          const id = b.getAttribute("data-block-id");
          if (id === selId) continue;
          const br = b.getBoundingClientRect();
          if (r.left < br.right && r.right > br.left && r.top < br.bottom && r.bottom > br.top) out.push(`${c.className} over ${id}`);
        }
      }
      return { chromeCount: chrome.length, out };
    });
    expect(hits.chromeCount, "toolbar is rendered").toBeGreaterThan(0);
    expect(hits.out, `toolbar clear of other blocks for ${prefix}`).toEqual([]);
  }
});

test.describe("inspector panel interaction", () => {
  test("Escape leaves a field and keeps the selection; Escape on the canvas clears it", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await select(page, "tpl-ad-kpi-1-");
    const label = page.getByRole("textbox", { name: "Label", exact: true });
    await label.click();
    await expect(label).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(label).not.toBeFocused();
    await expect(page.locator(".inspector-stack")).toBeVisible();
    await page.locator('[data-block-id^="tpl-ad-kpi-1-"]').first().focus();
    await page.keyboard.press("Escape");
    await expect(page.locator(".inspector-stack")).toHaveCount(0);
  });

  test("arrow keys step a number field and Shift steps by ten", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await select(page, "tpl-ad-kpi-1-");
    await expandAll(page);
    const gap = page.getByRole("spinbutton", { name: /Gap between children/ });
    await gap.focus();
    const start = Number(await gap.inputValue());
    await page.keyboard.press("ArrowUp");
    await expect(gap).toHaveValue(String(start + 1));
    await page.keyboard.press("Shift+ArrowUp");
    await expect(gap).toHaveValue(String(start + 11));
    await page.keyboard.press("ArrowDown");
    await expect(gap).toHaveValue(String(start + 10));
  });

  test("a typed edit is one undo step", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await select(page, "tpl-ad-kpi-1-");
    const label = page.getByRole("textbox", { name: "Label", exact: true });
    const original = await label.inputValue();
    await label.click();
    await label.pressSequentially(" plus more", { delay: 40 });
    await expect(page.locator('[data-block-id^="tpl-ad-kpi-1-"]').first()).toContainText(`${original} plus more`);
    await page.locator(".bp-viewport-wrapper").click({ position: { x: 4, y: 4 } });
    await page.getByRole("button", { name: /^Undo \(/ }).click();
    await expect(page.locator('[data-block-id^="tpl-ad-kpi-1-"]').first()).toContainText(original);
    await expect(page.locator('[data-block-id^="tpl-ad-kpi-1-"]').first()).not.toContainText("plus more");
  });

  test("a collapsed section stays collapsed when the selection changes", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await select(page, "tpl-ad-kpi-1-");
    const size = page.locator(".inspector-section-head", { hasText: "Size" });
    await expect(size).toHaveAttribute("aria-expanded", "true");
    await size.click();
    await expect(size).toHaveAttribute("aria-expanded", "false");
    await select(page, "tpl-ad-hero-");
    await expect(page.locator(".inspector-section-head", { hasText: "Size" })).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".lib-body")).toHaveJSProperty("scrollTop", 0);
  });

  test("the Size row explains itself: a value field only for px and %", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await select(page, "tpl-ad-kpi-1-");
    const mode = page.getByRole("combobox", { name: "Width sizing mode" });
    /* A template block spans grid columns (3fr), so it starts with a value. */
    await expect(page.getByRole("spinbutton", { name: "Width value" })).toHaveValue("3");
    await expect(mode).toHaveValue("fr");
    await mode.selectOption("fill");
    await expect(page.getByRole("spinbutton", { name: "Width value" })).toHaveCount(0);
    await mode.selectOption("px");
    const value = page.getByRole("spinbutton", { name: "Width value" });
    await expect(value).toBeVisible();
    await expect(value).toHaveValue("320");
    await mode.selectOption("fill");
    await expect(page.getByRole("spinbutton", { name: "Width value" })).toHaveCount(0);
  });

  test("toggles are switches and sliders show their value", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await select(page, "tpl-ad-hero-");
    const frame = page.getByRole("switch", { name: "Framed panel" });
    await expect(frame).toBeVisible();
    const before = await frame.getAttribute("aria-checked");
    await frame.focus();
    await page.keyboard.press("Space");
    await expect(frame).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
    const slider = page.getByRole("slider", { name: /^Height/ });
    await slider.fill("300");
    await expect(page.locator(".inspector-field", { has: slider })).toContainText("300");
  });
});

test("the Editing chip in the chat column does not overlap other chat content", async ({ page }) => {
  await openAnalyticsInEdit(page);
  await select(page, "tpl-ad-kpi-1-");
  const chip = page.locator(".chat-scope-chip");
  await expect(chip).toBeVisible();
  const overlaps = await page.evaluate(() => {
    const chip = document.querySelector(".chat-scope-chip")!.getBoundingClientRect();
    const others = [...document.querySelectorAll(".chat-scroll *")].filter((el) => el.children.length === 0 && el.textContent?.trim());
    return others.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.left < chip.right && r.right > chip.left && r.top < chip.bottom && r.bottom > chip.top;
    }).map((el) => el.textContent?.trim().slice(0, 30));
  });
  expect(overlaps).toEqual([]);
});

test("the panel at 1024 wide keeps its inset and the phone sheet opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await openAnalyticsInEdit(page);
  await select(page, "tpl-ad-kpi-1-");
  await expandAll(page);
  await page.waitForTimeout(300);
  const m = await panelRows(page);
  expect(m.overflow, `no horizontal overflow (${m.offenders.join("; ")})`).toBeLessThanOrEqual(0);
  for (const r of m.rows) {
    expect(Math.abs(r.left - INSET), `row "${r.text}" left inset`).toBeLessThanOrEqual(1);
    expect(Math.abs(r.right - INSET), `row "${r.text}" right inset`).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const sheet = page.locator(".component-sidebar");
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await expect(sheet).toBeHidden();
});

/* Opens the Analytics template in Edit without assuming the panel is open. */
async function openAnalyticsEditNoPanel(page: Page) {
  await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
  await page.waitForTimeout(600);
}

test.describe("panel auto-open", () => {
  for (const [label, width, height] of [["phone", 390, 844], ["tablet", 820, 1180]] as const) {
    test(`${label}: entering Edit does not open the panel; a selection does`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openAnalyticsEditNoPanel(page);
      await expect(page.locator(".component-sidebar")).toHaveCount(0);
      await select(page, "tpl-ad-kpi-1-");
      await expect(page.locator(".component-sidebar")).toBeVisible();
      await expect(page.locator(".component-sidebar .lib-header-title")).toBeInViewport();
      await expect(page.locator(".component-sidebar").getByRole("button", { name: "Close panel", exact: true })).toBeInViewport();
      if (label === "phone") await page.screenshot({ path: "test-results/phone-sheet.png" });
    });
  }

  test("a closed panel stays closed across a Preview round trip; Show opens it", async ({ page }) => {
    await openAnalyticsInEdit(page);
    await page.getByRole("button", { name: "Close panel", exact: true }).click();
    await expect(page.locator(".component-sidebar")).toHaveCount(0);
    await page.getByRole("button", { name: "Preview mode" }).click();
    await expect(page.locator(".present-stage")).toBeVisible();
    await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
    await page.waitForTimeout(600);
    await expect(page.locator(".component-sidebar")).toHaveCount(0);
    await page.keyboard.press("ControlOrMeta+Shift+p");
    await expect(page.locator(".present-stage")).toBeVisible();
    await page.keyboard.press("ControlOrMeta+Shift+p");
    await page.waitForTimeout(600);
    await expect(page.locator(".component-sidebar")).toHaveCount(0);
    await page.getByRole("button", { name: "Show component library", exact: true }).click();
    await expect(page.locator(".component-sidebar")).toBeVisible();
  });

  test("a chat-built canvas gets the panel with its first blocks, so the first selection does not re-fit", async ({ page }) => {
    await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
    await page.goto("/builder", { waitUntil: "domcontentloaded" });
    const chat = page.getByRole("textbox", { name: "Chat message input" });
    await expect(chat).toBeVisible({ timeout: 30_000 });
    await chat.fill("build an internal dashboard");
    await chat.press("Enter");
    const built = page.locator(".content-split.has-preview .bp-main [data-block-id]").first();
    const ds = page.getByRole("button", { name: "Salt DS", exact: true });
    await expect(built.or(ds).first()).toBeVisible();
    if (!(await built.isVisible())) await ds.click();
    await expect(built).toBeVisible();
    /* The panel is there with the first blocks (no later open); what still
       moves is the chat column sliding open (its min-width transition narrows
       the stage, which re-fits the frame) and the blocks' entrance replaying
       when generation ends. Measure only once the canvas has truly settled:
       generation finished, no layout-affecting transition or animation on
       the stage's ancestors or inside the frame, and the zoom and block
       rects identical over ten consecutive frames. */
    await expect(page.locator(".component-sidebar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop generating" })).toHaveCount(0);
    const rects = () => page.evaluate(() => {
      const frame = document.querySelector(".bp-device-frame") as HTMLElement;
      return { zoom: frame.getAttribute("data-frame-zoom"), b: [...document.querySelectorAll(".bp-main [data-block-id]")].slice(0, 4).map((el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width].map(Math.round); }) };
    });
    const settled = async () => {
      await expect.poll(() => page.evaluate(async () => {
        const layoutProps = /width|height|flex|transform|margin|padding|left|right|top|bottom|inset|zoom/;
        const busy = () => document.getAnimations().some((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
          if (!target) return false;
          const name = (a as CSSAnimation).animationName ?? "";
          const prop = (a as CSSTransition).transitionProperty ?? "";
          if (name === "bp-pulse") return false;
          const onStage = !!target.closest(".preview-side, .content-split");
          const inChat = !!target.closest(".chat-slide, .chat-layout");
          if (!onStage) return false;
          if (inChat) return prop ? layoutProps.test(prop) : false;
          return prop ? layoutProps.test(prop) : true;
        });
        const frame = document.querySelector(".bp-device-frame") as HTMLElement | null;
        if (!frame) return "no frame";
        const read = () => JSON.stringify([frame.getAttribute("data-frame-zoom"), ...[...document.querySelectorAll(".bp-main [data-block-id]")].slice(0, 4).map((el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })]);
        const first = read();
        for (let i = 0; i < 10; i++) {
          await new Promise(requestAnimationFrame);
          if (busy()) return "animating";
          if (read() !== first) return "moving";
        }
        return "settled";
      }), { timeout: 20_000, intervals: [100] }).toBe("settled");
    };
    await settled();
    const before = await rects();
    const first = page.locator(".bp-main [data-block-id]").first();
    await first.focus();
    await first.press("Enter");
    await expect(page.locator(".inspector-stack")).toBeVisible();
    await settled();
    expect(await rects()).toEqual(before);
  });
});

test("the hover pill on a second-row block is clear of other blocks and does not move on click", async ({ page }) => {
  await openAnalyticsInEdit(page);
  const block = page.locator('[data-block-id^="tpl-ad-kpi-2-"]').first();
  const box = (await block.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const pill = page.locator(".hover-inspector-toolbar");
  await expect(pill).toBeVisible();
  await page.waitForTimeout(250);
  const measure = () => page.evaluate(() => {
    const pill = document.querySelector(".hover-inspector-toolbar")!;
    const r = pill.getBoundingClientRect();
    const host = pill.closest("[data-block-id]")!.getAttribute("data-block-id");
    const hits = [...document.querySelectorAll(".bp-main [data-block-id], .bp-header [data-block-id]")].filter((b) => b.getAttribute("data-block-id") !== host).filter((b) => { const o = b.getBoundingClientRect(); return r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top; }).map((b) => b.getAttribute("data-block-id"));
    return { rect: [r.x, r.y, r.width, r.height].map(Math.round), placement: pill.getAttribute("data-placement"), hits };
  });
  const hovered = await measure();
  expect(hovered.hits, "hover pill clear of other blocks").toEqual([]);
  await block.click({ position: { x: 6, y: 6 } });
  await expect(page.locator(".hover-inspector.is-pinned")).toBeVisible();
  await page.waitForTimeout(300);
  const pinned = await measure();
  expect(pinned.rect, "pill does not move on click").toEqual(hovered.rect);
  expect(pinned.hits).toEqual([]);
  await page.screenshot({ path: "test-results/hover-pill-row2.png" });
});
