import { test, expect, type Page, type Request } from "@playwright/test";
import { deflateSync } from "node:zlib";

/* Build the UI from an uploaded image (Task 16). The model call is stubbed
   at the network layer: /api/chat returns the route's own stream format
   (text frames, then {tool_use} frames, then [DONE]). No real model. */

const chatInput = (page: Page) => page.getByRole("textbox", { name: "Chat message input" });
const bodyBlocks = (page: Page) => page.locator('.bp-main [data-block-id][data-zone="body"]');

/* A real, decodable PNG (solid colour) so the thumbnail renders. */
function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function makePng(width: number, height: number, rgb: [number, number, number] = [92, 124, 250]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row.set(rgb, 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const PNG = makePng(320, 200);
const PNG_B64 = PNG.toString("base64");

const sse = (frames: unknown[]) =>
  frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n";

const STUB_REPLY = sse([
  { text: "I see a sales overview with two KPI cards." },
  { tool_use: { name: "addBlock", input: { type: "SimulatedStatCard", props: { label: "Pipeline from image", value: "$1.2M", pct: 70 }, layout: { width: "fill" } } } },
  { tool_use: { name: "addBlock", input: { type: "SimulatedStatCard", props: { label: "Win rate from image", value: "31%", pct: 31 }, layout: { width: "fill" } } } },
  { text: " I could not match the illustration in the header, so I left it out." },
]);

async function openBuilder(page: Page) {
  const chatRequests: Request[] = [];
  await page.route("**/api/health", (route) =>
    route.fulfill({ json: { anthropicConfigured: true, firebaseConfigured: false } }),
  );
  await page.route("**/api/chat", (route) => {
    chatRequests.push(route.request());
    return route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body: STUB_REPLY });
  });
  await page.goto("/builder");
  await expect(chatInput(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Attach an image" })).toBeVisible();
  return chatRequests;
}

type ChatBody = { messages: { role: string; content: string; image?: { mediaType: string; data: string } }[] };
const bodyOf = (req: Request) => req.postDataJSON() as ChatBody;

async function expectImageTurn(page: Page, chatRequests: Request[]) {
  await expect.poll(() => chatRequests.length).toBe(1);
  const body = bodyOf(chatRequests[0]);
  const last = body.messages[body.messages.length - 1];
  expect(last.role).toBe("user");
  expect(last.image).toEqual({ mediaType: "image/png", data: PNG_B64 });
  expect(body.messages.slice(0, -1).some((m) => m.image)).toBe(false);
  /* The returned tool calls build the canvas. */
  await expect(page.locator(".bp-main").getByText("Pipeline from image")).toBeVisible();
  await expect(page.locator(".bp-main").getByText("Win rate from image")).toBeVisible();
  /* Transcript keeps only the marker; the chip is gone. */
  await expect(page.locator(".chat-msg-user .chat-msg-attachment")).toHaveText(/Image attached/);
  await expect(page.locator(".composer-attachment")).toHaveCount(0);
  /* The image never lands in local storage. */
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(stored).not.toContain(PNG_B64.slice(0, 60));
}

/* Paste and drop need a real File inside the page. */
async function dispatchFileEvent(page: Page, kind: "paste" | "drop" | "dragenter", withText?: string) {
  await page.evaluate(
    ({ b64, kind, withText }) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const file = new File([bytes], "dashboard.png", { type: "image/png" });
      const dt = new DataTransfer();
      dt.items.add(file);
      if (withText) {
        dt.setData("text/plain", withText);
        dt.setData("text/html", `<table><tr><td>${withText}</td></tr></table>`);
      }
      if (kind === "paste") {
        const target = document.querySelector("textarea.input-textarea")!;
        target.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
      } else {
        const target = document.querySelector(".chat-input-bar .input-box")!;
        target.dispatchEvent(new DragEvent(kind, { dataTransfer: dt, bubbles: true, cancelable: true }));
      }
    },
    { b64: PNG_B64, kind, withText },
  );
}

test.describe("Build the UI from an uploaded image", () => {
  test("attach with the button: chip, send, image in the request, canvas built", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    const before = await bodyBlocks(page).count();
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Attach an image" }).click();
    await (await chooser).setFiles({ name: "sales-overview.png", mimeType: "image/png", buffer: PNG });
    const chip = page.getByRole("group", { name: "Attached image: sales-overview.png" });
    await expect(chip).toBeVisible();
    await expect(chip).toContainText("320 × 200");
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
    await page.getByRole("button", { name: "Send" }).click();
    await expectImageTurn(page, chatRequests);
    expect(bodyOf(chatRequests[0]).messages.at(-1)!.content).toMatch(/Build this screen from the image\.$/);
    await expect.poll(() => bodyBlocks(page).count()).toBeGreaterThan(before);
  });

  test("paste an image into the message box, with a note", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    await chatInput(page).fill("Make it a CRM dashboard");
    await dispatchFileEvent(page, "paste");
    await expect(page.getByRole("group", { name: "Attached image: dashboard.png" })).toBeVisible();
    await expect(chatInput(page)).toHaveValue("Make it a CRM dashboard");
    await chatInput(page).press("Enter");
    await expectImageTurn(page, chatRequests);
    expect(bodyOf(chatRequests[0]).messages.at(-1)!.content).toMatch(/Make it a CRM dashboard$/);
  });

  test("an Office-style paste (text plus a rendered bitmap) stays text and attaches nothing", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    await chatInput(page).focus();
    await dispatchFileEvent(page, "paste", "Q3 revenue 4.2M");
    await expect(page.locator(".composer-attachment")).toHaveCount(0);
    /* The browser default ran: the text was inserted, not swallowed. A
       synthetic paste does not insert text in Chromium, so the check is that
       the event was not cancelled. */
    const cancelled = await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], "cells.png", { type: "image/png" }));
      dt.setData("text/plain", "Q3 revenue 4.2M");
      const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
      document.querySelector("textarea.input-textarea")!.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    expect(cancelled).toBe(false);
    expect(chatRequests).toHaveLength(0);
  });

  test("'Copy image' from a web page (img-only html, no text) attaches", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    await chatInput(page).focus();
    await page.evaluate((b64) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], "image.png", { type: "image/png" }));
      dt.setData("text/html", '<meta charset="utf-8"><img src="https://example.com/dashboard.png" alt="">');
      document.querySelector("textarea.input-textarea")!.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    }, PNG_B64);
    await expect(page.getByRole("group", { name: "Attached image: image.png" })).toBeVisible();
    expect(chatRequests).toHaveLength(0);
  });

  test("blocks from a multi-call build land top to bottom in the order emitted", async ({ page }) => {
    await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: true, firebaseConfigured: false } }));
    const order = ["Page selector", "Configuration", "Report defaults", "Base currency", "Data sources"];
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: sse([
          { text: "Building it." },
          { tool_use: { name: "clearCanvas", input: { zone: "body" } } },
          ...order.map((title) => ({ tool_use: { name: "addBlock", input: { type: "SimulatedCard", props: { title }, layout: { width: "fill" } } } })),
        ]),
      }),
    );
    await page.goto("/builder");
    await page.locator('[data-testid="composer-file-input"]').setInputFiles({ name: "config.png", mimeType: "image/png", buffer: PNG });
    await expect(page.locator(".composer-attachment")).toBeVisible();
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.locator(".bp-main").getByText("Data sources")).toBeVisible();
    const seen = await bodyBlocks(page).evaluateAll((els, wanted) =>
      els.map((el) => wanted.find((w) => el.textContent?.includes(w))).filter(Boolean),
      order,
    );
    expect(seen).toEqual(order);
  });

  test("a file dropped outside the composer does not navigate away", async ({ page }) => {
    await openBuilder(page);
    const prevented = await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array([1])], "x.png", { type: "image/png" }));
      const ev = new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true });
      document.body.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    expect(prevented).toBe(true);
    await expect(page).toHaveURL(/\/builder/);
  });

  test("drag and drop shows the drop state, then attaches", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    await dispatchFileEvent(page, "dragenter");
    await expect(page.locator(".composer-drop-veil")).toHaveText(/Drop an image to build from it/);
    await dispatchFileEvent(page, "drop");
    await expect(page.locator(".composer-drop-veil")).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Attached image: dashboard.png" })).toBeVisible();
    await page.getByRole("button", { name: "Send" }).click();
    await expectImageTurn(page, chatRequests);
  });

  test("remove clears the image and sends nothing", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    await page.locator('[data-testid="composer-file-input"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: PNG });
    await expect(page.locator(".composer-attachment")).toBeVisible();
    await page.getByRole("button", { name: "Remove image" }).click();
    await expect(page.locator(".composer-attachment")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
    await chatInput(page).press("Enter");
    expect(chatRequests).toHaveLength(0);
  });

  test("a file that is not an image shows the error and sends nothing", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
    await page.locator('[data-testid="composer-file-input"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: svg });
    await expect(page.getByRole("status").filter({ hasText: "That file isn't an image we can read" })).toBeVisible();
    await expect(page.locator(".composer-attachment")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(chatRequests).toHaveLength(0);
    /* Typing clears the error; dismiss also works. */
    await chatInput(page).pressSequentially("a");
    await expect(page.locator(".composer-attach-error")).toHaveCount(0);
  });

  test("a server image reject reads as an image problem, not a connection one", async ({ page }) => {
    await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: true, firebaseConfigured: false } }));
    await page.route("**/api/chat", (route) =>
      route.fulfill({ status: 400, json: { error: "That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB." } }),
    );
    await page.goto("/builder");
    await page.locator('[data-testid="composer-file-input"]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: PNG });
    await expect(page.locator(".composer-attachment")).toBeVisible();
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(/That image could not be used/).first()).toBeVisible();
    await expect(page.getByText(/trouble connecting/)).toHaveCount(0);
  });

  test("an oversize file shows the error and sends nothing", async ({ page }) => {
    const chatRequests = await openBuilder(page);
    const huge = Buffer.concat([PNG, Buffer.alloc(21 * 1024 * 1024)]);
    await page.locator('[data-testid="composer-file-input"]').setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: huge });
    await expect(page.getByRole("status").filter({ hasText: "That image is too large" })).toBeVisible();
    await expect(page.locator(".composer-attachment")).toHaveCount(0);
    expect(chatRequests).toHaveLength(0);
  });
});
