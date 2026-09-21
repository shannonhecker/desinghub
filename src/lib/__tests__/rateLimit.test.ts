import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/* Control the Upstash client per test: `behaviour` decides whether the
   pipeline resolves with a count or throws (simulated Redis outage). */
const behaviour = { mode: "ok" as "ok" | "throw", count: 1 };

vi.mock("@upstash/redis", () => {
  class Redis {
    pipeline() {
      const p = {
        zremrangebyscore: () => p,
        zadd: () => p,
        zcard: () => p,
        expire: () => p,
        exec: async () => {
          if (behaviour.mode === "throw") throw new Error("ECONNREFUSED");
          return [0, 1, behaviour.count, 1];
        },
      };
      return p;
    }
    async zrem() { return 1; }
    async zrange() { return []; }
  }
  return { Redis };
});

import { checkRateLimit } from "../rateLimit";

const saved = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
beforeEach(() => {
  behaviour.mode = "ok";
  behaviour.count = 1;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  if (saved.url) process.env.UPSTASH_REDIS_REST_URL = saved.url;
  if (saved.token) process.env.UPSTASH_REDIS_REST_TOKEN = saved.token;
  vi.restoreAllMocks();
});

describe("checkRateLimit", () => {
  it("unconfigured (no Upstash env): no-op allow, so local dev keeps working", async () => {
    const r = await checkRateLimit("1.2.3.4", "chat");
    expect(r.allowed).toBe(true);
  });

  it("configured + under the window: allowed with remaining budget", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    behaviour.count = 5;
    const r = await checkRateLimit("1.2.3.4", "chat");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(15);
  });

  it("configured + over the window: denied", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    behaviour.count = 21;
    const r = await checkRateLimit("1.2.3.4", "chat");
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("configured but Redis is down: FAILS CLOSED (a limiter outage must not become unlimited spend)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "t";
    behaviour.mode = "throw";
    const r = await checkRateLimit("1.2.3.4", "chat");
    expect(r.allowed).toBe(false);
    expect(r.resetInSeconds).toBeGreaterThan(0);
  });
});
