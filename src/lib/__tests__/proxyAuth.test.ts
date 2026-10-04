import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { issueSessionToken } from "../sessionToken";
beforeEach(() => { vi.stubEnv("STAGING_PASSWORD", "pw"); vi.stubEnv("STAGING_TOKEN_SECRET", "secret"); });
afterEach(() => vi.unstubAllEnvs());
const request = (path: string, token = "") => new NextRequest(`https://example.test${path}`, { headers: token ? { cookie: `uoaui_auth_token=${token}` } : {} });
describe("builder proxy", () => {
  it("redirects missing or expired sessions and accepts a fresh session", async () => {
    expect((await proxy(request("/builder"))).status).toBe(307);
    expect((await proxy(request("/builder", issueSessionToken("secret", Math.floor(Date.now() / 1000) - 3601)))).status).toBe(307);
    expect((await proxy(request("/builder", issueSessionToken("secret")))).headers.get("x-middleware-next")).toBe("1");
  });
  it("does not use forwarded-IP headers as authentication", async () => {
    vi.stubEnv("ADMIN_IPS", "10.0.0.1");
    expect((await proxy(new NextRequest("https://example.test/builder", { headers: { "x-forwarded-for": "10.0.0.1", "x-real-ip": "10.0.0.1" } }))).status).toBe(307);
  });
  it("keeps shared previews public even when the gate is misconfigured", async () => {
    vi.stubEnv("STAGING_TOKEN_SECRET", "");
    expect((await proxy(request("/preview/share/example"))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(request("/builder"))).status).toBe(307);
  });
  it("keeps the UI public when no password gate is configured", async () => {
    vi.stubEnv("STAGING_PASSWORD", "");
    expect((await proxy(request("/builder"))).headers.get("x-middleware-next")).toBe("1");
  });
});
