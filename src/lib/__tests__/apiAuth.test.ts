import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { issueSessionToken } from "../sessionToken";
import { requireBuilderAuth } from "../apiAuth";

const ENV_KEYS = ["STAGING_PASSWORD", "STAGING_TOKEN_SECRET", "ADMIN_IPS"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/chat", { method: "POST", headers });
}

/* Same signed session the login route mints. */
function tokenFor(secret: string): string {
  return issueSessionToken(secret);
}

describe("requireBuilderAuth — AI routes honour the staging gate", () => {
  it("missing authentication configuration: fails closed", async () => {
    expect((await requireBuilderAuth(req()))?.status).toBe(503);
  });

  it("password set without a signing secret: fails closed with 503", async () => {
    process.env.STAGING_PASSWORD = "pw";
    const res = await requireBuilderAuth(req());
    expect(res?.status).toBe(503);
  });

  it("password set, no cookie: 401 (this was the open-proxy hole)", async () => {
    process.env.STAGING_PASSWORD = "pw";
    process.env.STAGING_TOKEN_SECRET = "secret";
    const res = await requireBuilderAuth(req());
    expect(res?.status).toBe(401);
    expect(await res!.json()).toEqual({ error: "Sign in required" });
  });

  it("requires a signed session even when the UI password gate is disabled", async () => {
    process.env.STAGING_TOKEN_SECRET = "secret";
    expect((await requireBuilderAuth(req()))?.status).toBe(401);
    expect(await requireBuilderAuth(req({ cookie: `uoaui_auth_token=${issueSessionToken("secret")}` }))).toBeNull();
  });

  it("wrong cookie: 401", async () => {
    process.env.STAGING_PASSWORD = "pw";
    process.env.STAGING_TOKEN_SECRET = "secret";
    const res = await requireBuilderAuth(req({ cookie: "uoaui_auth_token=deadbeef" }));
    expect(res?.status).toBe(401);
  });

  it("valid signed session cookie: allowed", async () => {
    process.env.STAGING_PASSWORD = "pw";
    process.env.STAGING_TOKEN_SECRET = "secret";
    const token = tokenFor("secret");
    const res = await requireBuilderAuth(req({ cookie: `other=1; uoaui_auth_token=${token}; x=y` }));
    expect(res).toBeNull();
  });

  it("forwarded IP headers cannot bypass signed-session authentication", async () => {
    process.env.STAGING_PASSWORD = "pw";
    process.env.STAGING_TOKEN_SECRET = "secret";
    process.env.ADMIN_IPS = "10.0.0.1, 10.0.0.2";
    expect((await requireBuilderAuth(req({ "x-forwarded-for": "10.0.0.2, 1.1.1.1" })))?.status).toBe(401);
    expect((await requireBuilderAuth(req({ "x-forwarded-for": "9.9.9.9" })))?.status).toBe(401);
  });
});
