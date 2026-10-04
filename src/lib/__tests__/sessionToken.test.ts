import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { issueSessionToken, verifySessionToken, SESSION_TTL_SECONDS } from "../sessionToken";

const secret = "test-signing-secret";
const now = 1_800_000_000;
describe("signed builder sessions", () => {
  it("issues a unique, verifiable one-hour session per login", () => {
    const first = issueSessionToken(secret, now);
    expect(verifySessionToken(first, secret, now)).toBe(true);
    expect(issueSessionToken(secret, now)).not.toBe(first);
    expect(verifySessionToken(first, secret, now + SESSION_TTL_SECONDS - 1)).toBe(true);
    expect(verifySessionToken(first, secret, now + SESSION_TTL_SECONDS)).toBe(false);
  });
  it("rejects wrong secrets, tampering, future timestamps, and legacy password hashes", () => {
    const token = issueSessionToken(secret, now);
    expect(verifySessionToken(token, "other-secret", now)).toBe(false);
    expect(verifySessionToken(token + "x", secret, now)).toBe(false);
    expect(verifySessionToken(token, secret, now - 120)).toBe(false);
    expect(verifySessionToken(createHmac("sha256", secret).update("pw").digest("hex"), secret, now)).toBe(false);
  });
  it.each(["", "a.b.c", "a.b", "x".repeat(2000)])("rejects malformed tokens without throwing", token => {
    expect(verifySessionToken(token, secret, now)).toBe(false);
  });
});
