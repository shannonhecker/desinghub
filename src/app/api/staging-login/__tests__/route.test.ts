import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/sessionToken";
const limiter = vi.hoisted(() => vi.fn());
vi.mock("@/lib/rateLimit", () => ({ checkLoginRateLimit: limiter, checkRateLimit: limiter, getClientIp: () => "127.0.0.1" }));
import { POST } from "../route";
const post = (body: string, contentType = "application/json") => POST(new NextRequest("https://example.test/api/staging-login", { method: "POST", headers: { "content-type": contentType }, body }));
beforeEach(() => {
  vi.stubEnv("STAGING_PASSWORD", "correct-password");
  vi.stubEnv("STAGING_TOKEN_SECRET", "test-secret");
  limiter.mockResolvedValue({ allowed: true, resetInSeconds: 0 });
});
afterEach(() => vi.unstubAllEnvs());
describe("staging login", () => {
  it.each(["null", "[]", "{"])("malformed body %s returns 400", async body => expect((await post(body)).status).toBe(400));
  it("caps the full body before parsing", async () => expect((await post(JSON.stringify({ password: "x".repeat(5000) }))).status).toBe(413));
  it("denies when the login limiter is unavailable", async () => {
    limiter.mockResolvedValue({ allowed: false, resetInSeconds: 10 });
    const response = await post('{"password":"correct-password"}');
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("10");
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });
  it("issues an expiring signed cookie only for valid credentials", async () => {
    expect((await post('{"password":"wrong"}')).status).toBe(401);
    const response = await post('{"password":"correct-password"}');
    expect(response.status).toBe(200);
    expect(verifySessionToken(response.cookies.get(SESSION_COOKIE)!.value, "test-secret")).toBe(true);
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i);
  });
  it("supports the login form as well as JSON", async () => expect((await post("password=correct-password", "application/x-www-form-urlencoded")).status).toBe(200));
});
