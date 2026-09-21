import { test, expect, type Page } from "@playwright/test";
import {
  installChatMocks,
  fence,
  MOCK_MISS,
  REFUSAL_COPY,
  CHAT_ERROR_COPY,
  type ChatMockState,
} from "./chatMock";

/**
 * Builder chat user-flow suite: the chatbox adds ANY component to ANY
 * zone, including duplicates of types already on canvas.
 *
 * /api/health and /api/chat are intercepted in the browser (chatMock.ts)
 * so no ANTHROPIC_API_KEY is needed and no network leaves the machine.
 * This validates the CLIENT pipeline (send -> SSE parse -> action apply
 * -> canvas render); prompt efficacy is pinned separately by the vitest
 * unit tests on chatSystem.ts.
 *
 * Prompt wording rules (immunized against local fast-paths):
 *  - first-turn prompts carry an audience signal (internal/team/ops...)
 *    or avoid app-like words, else the audience chip gate short-circuits
 *  - no "dark"/"light"/"salt"/"material"/"m3"/"fluent"/"uoaui" substrings
 *    (theme/DS fast-paths), no "remove"/"clear" (destructive local ops),
 *    no back-to-login phrasing
 */

const COMPOSER = 'textarea[aria-label="Chat message input"]:visible';
const CHAT_LOG = '[role="log"][aria-label="Chat messages"]';
const OFFLINE_HINT = ".chat-input-hint";

function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

async function gotoBuilder(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  const composer = page.locator(COMPOSER);
  await expect(composer).toBeVisible({ timeout: 120_000 });
  /* The SSR markup paints the composer before React hydrates; text typed
     into the pre-hydration textarea never reaches the store and is wiped
     by the first controlled render. Probe hydration: keep re-typing
     until the controlled Send button reflects the store (hasText ->
     enabled), then clear. */
  await expect(async () => {
    await composer.fill("hydration-probe");
    expect(
      await page.locator('button[aria-label="Send"]:visible').isEnabled(),
    ).toBe(true);
  }).toPass({ timeout: 60_000 });
  await composer.fill("");
}

async function sendChat(page: Page, text: string) {
  const composer = page.locator(COMPOSER);
  await composer.click();
  await composer.fill(text);
  await composer.press("Enter");
}

/* handleSend hard-bails while isGenerating, so every follow-up send must
   wait for the in-flight turn to settle (Stop button unmounts). */
async function waitForIdle(page: Page) {
  await expect(page.locator('button[aria-label="Stop generating"]')).toHaveCount(0, {
    timeout: 30_000,
  });
}

/* Mock-integrity trio + copy gate, asserted at the end of every test. */
async function expectHonestTranscript(
  page: Page,
  state: ChatMockState,
  expectedChatCalls: number,
) {
  expect(state.chatCalls).toBe(expectedChatCalls);
  expect(state.missCount).toBe(0);
  const log = await page.locator(CHAT_LOG).innerText();
  expect(log).not.toContain(MOCK_MISS);
  expect(log).not.toMatch(REFUSAL_COPY);
  expect(log).not.toMatch(CHAT_ERROR_COPY);
}

test.describe("Builder chat — any component, any zone, duplicates land", () => {
  test("a second SimulatedDataTable requested via chat actually lands (2 on canvas)", async ({
    page,
    context,
  }) => {
    const pageErrors = trackPageErrors(page);
    const state = await installChatMocks(context, {
      anthropicConfigured: true,
      rules: [
        {
          match: /ops overview/i,
          reply: () =>
            [
              "Here is your ops overview with the watering table.",
              fence({ action: "setInterfaceType", value: "dashboard" }),
              fence({
                action: "addBlock",
                value: {
                  type: "SimulatedDataTable",
                  zone: "body",
                  props: {
                    columns: ["Task", "Owner", "Status"],
                    rows: [{ Task: "Fern-watering", Owner: "Dana", Status: "Due" }],
                  },
                  layout: { width: "fill" },
                },
              }),
            ].join("\n\n"),
        },
        {
          match: /second data table/i,
          reply: () =>
            [
              "Added a second table for the recent refunds.",
              fence({
                action: "addBlock",
                value: {
                  type: "SimulatedDataTable",
                  zone: "body",
                  props: {
                    columns: ["Refund", "Amount"],
                    rows: [{ Refund: "R-201-refund", Amount: "$42" }],
                  },
                  layout: { width: "fill" },
                },
              }),
            ].join("\n\n"),
        },
      ],
    });

    await gotoBuilder(page);
    await expect(page.locator(OFFLINE_HINT)).toHaveCount(0);

    // Turn 1: seed one table (audience signal present, no fast-path words).
    await sendChat(page, "Build an internal ops overview for the plant care team");
    await expect(page.getByText("Fern-watering")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-zone="body"] table')).toHaveCount(1);
    await waitForIdle(page);

    // Turn 2: THE regression — a duplicate of an existing type must land.
    await sendChat(page, "Please put a second data table under it showing recent refunds");
    await expect(page.getByText("R-201-refund")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Fern-watering")).toBeVisible();
    await expect(page.locator('[data-zone="body"] table')).toHaveCount(2);
    await expect(page.locator('[data-block-id^="ai-"][data-zone="body"]')).toHaveCount(2);
    await waitForIdle(page);

    // Request shape sanity: one POST per send, context prefix intact.
    expect(state.posts).toHaveLength(2);
    for (const post of state.posts) {
      expect(["salt", "m3", "fluent", "carbon", "uoaui"]).toContain(post.designSystem);
      const users = (post.messages ?? []).filter((m) => m.role === "user");
      expect(users[users.length - 1]?.content.startsWith("[Current state:")).toBe(true);
    }

    await expectHonestTranscript(page, state, 2);
    expect(pageErrors).toEqual([]);
  });

  test("addBlock lands in header, sidebar and footer; header table renders its mocked props", async ({
    page,
    context,
  }) => {
    const pageErrors = trackPageErrors(page);
    const state = await installChatMocks(context, {
      anthropicConfigured: true,
      rules: [
        {
          match: /helper widgets/i,
          reply: () =>
            [
              "Placed a species table up top, quick links on the side and a version badge at the bottom.",
              fence({
                action: "addBlock",
                value: {
                  type: "SimulatedDataTable",
                  zone: "header",
                  props: {
                    columns: ["Species", "Watered"],
                    rows: [{ Species: "Boston Fern", Watered: "Today" }],
                  },
                },
              }),
              fence({
                action: "addBlock",
                value: {
                  type: "SimulatedCard",
                  zone: "sidebar",
                  props: { title: "Quick links", content: "Ops shortcuts" },
                },
              }),
              fence({
                action: "addBlock",
                value: {
                  type: "SimulatedBadge",
                  zone: "footer",
                  props: { label: "v2.1-e2e" },
                },
              }),
            ].join("\n\n"),
        },
      ],
    });

    await gotoBuilder(page);
    await expect(page.locator(OFFLINE_HINT)).toHaveCount(0);

    /* Baselines per zone (templates/AppBrand could pre-populate zones in
       future defaults — never assume 0). ai- prefix keeps template and
       palette blocks out of the counts. */
    const aiInZone = (zone: string) =>
      page.locator(`[data-block-id^="ai-"][data-zone="${zone}"]`);
    const base = {
      header: await aiInZone("header").count(),
      sidebar: await aiInZone("sidebar").count(),
      footer: await aiInZone("footer").count(),
    };

    await sendChat(page, "Spread the helper widgets across the page for the internal ops crew");

    await expect(aiInZone("header")).toHaveCount(base.header + 1, { timeout: 30_000 });
    await expect(aiInZone("sidebar")).toHaveCount(base.sidebar + 1);
    await expect(aiInZone("footer")).toHaveCount(base.footer + 1);

    /* Zone-props fix (ComponentRenderer): the header table must render
       the MOCKED column content, not the shared default table. */
    await expect(page.locator('[data-zone="header"] table')).toHaveCount(1);
    await expect(page.locator('[data-zone="header"]').getByText("Species")).toBeVisible();
    await expect(page.locator('[data-zone="header"]').getByText("Boston Fern")).toBeVisible();
    await expect(page.locator('[data-zone="sidebar"]').getByText("Quick links")).toBeVisible();
    await expect(page.locator('[data-zone="footer"]').getByText("v2.1-e2e")).toBeVisible();
    await waitForIdle(page);

    await expectHonestTranscript(page, state, 1);
    expect(pageErrors).toEqual([]);
  });

  test("OFFLINE: repeated 'add a data table' produces a real duplicate and zone adds work locally", async ({
    page,
    context,
  }) => {
    const pageErrors = trackPageErrors(page);
    // anthropicConfigured false -> local command path; /api/chat must stay silent.
    const state = await installChatMocks(context, { anthropicConfigured: false });

    await gotoBuilder(page);
    // Offline canary: the local-command hint only renders when AI is off.
    await expect(page.locator(OFFLINE_HINT)).toBeVisible({ timeout: 15_000 });

    // Turn 1 (offline first turn): staged behind the DS question.
    await sendChat(page, "add a data table");
    const dsChips = page.getByRole("group", { name: "Choose a design system" });
    await expect(dsChips).toBeVisible({ timeout: 15_000 });
    await dsChips.getByRole("button", { name: "Salt DS" }).click();
    await expect(page.locator('[data-zone="body"] table')).toHaveCount(1, {
      timeout: 20_000,
    });
    await waitForIdle(page);

    // Turn 2: one table already present -> a REAL second table must land
    // (alsoAddIds path), and the reply stays honest about duplicating.
    await sendChat(page, "add a data table");
    await expect(page.locator('[data-zone="body"] table')).toHaveCount(2, {
      timeout: 20_000,
    });
    await expect(
      page.locator(CHAT_LOG).getByText(/Added another Data Table/),
    ).toBeVisible();
    await waitForIdle(page);

    // Turn 3: zone phrase routes the local add to the sidebar.
    const sidebarBlocks = page.locator('[data-block-id][data-zone="sidebar"]');
    const sidebarBase = await sidebarBlocks.count();
    await sendChat(page, "put a card in the sidebar");
    await expect(sidebarBlocks).toHaveCount(sidebarBase + 1, { timeout: 20_000 });
    await waitForIdle(page);

    // Everything above ran without the network AI path.
    expect(state.chatCalls).toBe(0);
    expect(state.missCount).toBe(0);
    const log = await page.locator(CHAT_LOG).innerText();
    expect(log).not.toContain(MOCK_MISS);
    expect(log).not.toMatch(CHAT_ERROR_COPY);
    expect(pageErrors).toEqual([]);
  });
});
