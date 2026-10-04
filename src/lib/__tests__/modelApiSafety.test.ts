import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../sessionToken";
const upstreamFailure = vi.hoisted(() => new Error("private-provider-detail sk-secret-example"));
vi.mock("@anthropic-ai/sdk", () => ({ default: class {
  messages = { create: async () => { throw upstreamFailure; }, stream: async () => { throw upstreamFailure; } };
} }));
vi.mock("@/lib/rateLimit", () => ({ checkModelRateLimit: async () => ({ allowed: true }), getClientIp: () => "127.0.0.1" }));
import { POST as chat } from "@/app/api/chat/route";
import { POST as content } from "@/app/api/builder/generate-content/route";
import { POST as table } from "@/app/api/builder/generate-table/route";
beforeEach(() => {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key"); vi.stubEnv("STAGING_TOKEN_SECRET", "test-secret"); vi.stubEnv("STAGING_PASSWORD", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const req = (body: unknown, authenticated = true) => new Request("https://example.test/api/model", { method: "POST", headers: { "content-type": "application/json", ...(authenticated ? { cookie: `uoaui_auth_token=${issueSessionToken("test-secret")}` } : {}) }, body: JSON.stringify(body) });
for (const [name, route, body] of [
  ["chat", chat, { messages: [{ role: "user", content: "Hi" }] }],
  ["content", content, { templateId: "risk-analytics", blocks: [{ id: "title", type: "PageTitle", props: {} }] }],
  ["table", table, { description: "Revenue by quarter" }],
] as const) describe(`${name} model boundary`, () => {
  it("requires auth even without a staging password", async () => expect((await route(req(body, false))).status).toBe(401));
  it("rejects null and oversized requests", async () => {
    expect((await route(req(null))).status).toBe(400);
    expect((await route(req({ extra: "x".repeat(600_000) }))).status).toBe(413);
  });
  it("logs upstream failures but sends only a generic error", async () => {
    const response = await route(req(body));
    const text = await response.text();
    expect(text).toContain("Generation is temporarily unavailable");
    expect(text).not.toContain("private-provider-detail");
    expect(text).not.toContain("sk-secret-example");
    expect(console.error).toHaveBeenCalledWith(expect.any(String), upstreamFailure);
  });
});
