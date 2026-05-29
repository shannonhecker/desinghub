import { describe, it, expect, vi, beforeEach } from "vitest";

/* The route imports the Anthropic SDK and rate limiter at the
   module level. We mock both so the unit test focuses on the
   validation surface and never touches the network. */
vi.mock("@anthropic-ai/sdk", () => {
  /* The route does `new Anthropic({ apiKey })`, so the default export
     must be constructable. A class with a `messages.stream` method
     returning an async-iterable satisfies the route's
     `for await (const event of stream)` loop. */
  class MockAnthropic {
    messages = {
      stream: async () =>
        (async function* () {
          /* empty event stream */
        })(),
    };
  }
  return { default: MockAnthropic };
});

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi
    .fn()
    .mockResolvedValue({ allowed: true, resetInSeconds: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
});

async function post(body: unknown): Promise<Response> {
  const { POST } = await import("../route");
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/chat: designSystem validation", () => {
  it("returns 400 on prompt-injection-like designSystem value", async () => {
    const res = await post({
      messages: [{ role: "user", content: "hi" }],
      designSystem: "<script>alert(1)</script>",
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/designSystem must be one of/);
  });

  it("returns 400 on unknown DS string", async () => {
    const res = await post({
      messages: [{ role: "user", content: "hi" }],
      designSystem: "tailwind",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 on non-string designSystem", async () => {
    const res = await post({
      messages: [{ role: "user", content: "hi" }],
      designSystem: 42,
    });
    expect(res.status).toBe(400);
  });

  it("accepts each canonical DS value", async () => {
    for (const ds of ["salt", "m3", "fluent", "carbon", "uoaui"]) {
      const res = await post({
        messages: [{ role: "user", content: "hi" }],
        designSystem: ds,
      });
      // Anything that isn't 400 means the validator let it through.
      // The mocked stream may complete with 200 + empty body.
      expect(res.status).not.toBe(400);
    }
  });

  it("accepts an omitted designSystem (defaults to salt)", async () => {
    const res = await post({
      messages: [{ role: "user", content: "hi" }],
    });
    expect(res.status).not.toBe(400);
  });
});
